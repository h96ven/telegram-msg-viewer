import base64
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

from app.config import settings
from app.database import get_db
from app.models import TelegramSession
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from telethon import errors
from telethon.sessions import StringSession
from telethon.sync import TelegramClient

router = APIRouter()

API_ID = settings.telegram_api_id
API_HASH = settings.telegram_api_hash

_photo_cache: dict[int, tuple[str, datetime]] = {}
CACHE_TTL = timedelta(hours=6)
_DIALOGS_CACHE: Dict[str, Tuple[List, datetime]] = {}
DLG_TTL = timedelta(seconds=60)
_USER_CACHE: dict[int, tuple[dict, datetime]] = {}
USER_TTL = timedelta(hours=6)


class PhoneNumber(BaseModel):
    phone: str


class CodeData(BaseModel):
    phone: str
    code: str | None = None
    password: str | None = None


pending: dict[str, str] = {}


@router.post("/connect")
async def connect_telegram(phone_data: PhoneNumber,
                           db: AsyncSession = Depends(get_db)):
    phone = phone_data.phone
    client = TelegramClient(StringSession(), API_ID, API_HASH)
    await client.connect()
    try:
        sent = await client.send_code_request(phone)
        session_str = client.session.save()

        existing_session = await db.scalar(
            select(TelegramSession).where(TelegramSession.phone == phone))
        if existing_session:
            existing_session.session_str = session_str
        else:
            db.add(TelegramSession(phone=phone, session_str=session_str))
        await db.commit()

        pending[phone] = sent.phone_code_hash
        return {"message": "Code sent"}

    except errors.PhoneNumberInvalidError:
        raise HTTPException(400, "Invalid phone number")
    finally:
        await client.disconnect()


@router.post("/verify")
async def verify_code(code_data: CodeData, db: AsyncSession = Depends(get_db)):
    phone, code, pwd = code_data.phone, code_data.code, code_data.password

    hash_ = pending.get(phone)
    if hash_ is None:
        raise HTTPException(400, "Start verification again")

    rec = await db.scalar(
        select(TelegramSession).where(TelegramSession.phone == phone))
    if not rec:
        raise HTTPException(400, "Start verification again")

    client = TelegramClient(StringSession(rec.session_str), API_ID, API_HASH)
    await client.connect()

    try:
        if pwd:
            await client.sign_in(password=pwd)
        elif code:
            await client.sign_in(phone=phone, code=code, phone_code_hash=hash_)
        else:
            raise HTTPException(400, "Code or password must be provided")

    except errors.SessionPasswordNeededError:
        tmp_session = client.session.save()
        await client.disconnect()

        rec.session_str = tmp_session
        await db.commit()
        raise HTTPException(401, "Two-step verification required")

    except errors.CodeInvalidError:
        await client.disconnect()
        raise HTTPException(400, "Invalid code")

    except errors.PhoneCodeExpiredError:
        await client.disconnect()
        raise HTTPException(400, "Code expired, request a new one")

    me = await client.get_me()
    my_id = me.id

    session_str = client.session.save()
    await client.disconnect()

    rec.session_str = session_str
    await db.commit()

    pending.pop(phone, None)

    return {
        "message": "Telegram account connected successfully",
        "my_id": my_id
    }


async def _get_client(phone: str, db: AsyncSession) -> TelegramClient:
    phone = phone.strip().replace(" ", "")
    if phone and phone[0] != "+":
        phone = f"+{phone}"

    rec = await db.scalar(
        select(TelegramSession).where(TelegramSession.phone == phone))
    if not rec:
        raise HTTPException(401, "Not authenticated")
    client = TelegramClient(StringSession(rec.session_str), API_ID, API_HASH)
    await client.connect()
    return client


async def _precache_photos(phone: str, db: AsyncSession, ids: list[int]):
    client = await _get_client(phone, db)
    for chat_id in ids:
        if chat_id in _photo_cache and _photo_cache[chat_id][
                1] > datetime.utcnow():
            continue
        try:
            entity = await client.get_entity(chat_id)
            raw = await client.download_profile_photo(entity, file=bytes)
            if raw:
                b64 = "data:image/jpeg;base64," + base64.b64encode(
                    raw).decode()
                _photo_cache[chat_id] = (b64, datetime.utcnow() + CACHE_TTL)
        except Exception:
            pass
    await client.disconnect()


@router.get("/chats")
async def get_chats(
        phone: str,
        background: BackgroundTasks,
        page: int = 1,
        size: int = 20,
        db: AsyncSession = Depends(get_db),
):
    now = datetime.utcnow()

    dialogs_all, ttl = _DIALOGS_CACHE.get(phone,
                                          ([], now - timedelta(seconds=1)))
    if ttl < now:
        client = await _get_client(phone, db)
        dialogs_all = await client.get_dialogs()
        await client.disconnect()
        _DIALOGS_CACHE[phone] = (dialogs_all, now + DLG_TTL)

    total = len(dialogs_all)
    start, end = (page - 1) * size, page * size
    slice_ = dialogs_all[start:end]

    chats = [{
        "id": d.id,
        "name": d.name or d.title or "Untitled"
    } for d in slice_]

    background.add_task(_precache_photos, phone, db, [d.id for d in slice_])

    return {"total": total, "page": page, "size": size, "chats": chats}


async def _get_entity_cached(client: TelegramClient, uid: int):
    now = datetime.utcnow()
    cached = _USER_CACHE.get(uid)
    if cached and cached[1] > now:
        return cached[0]  # already have fresh data

    entity = await client.get_entity(uid)
    name = getattr(entity, "first_name", None) or getattr(entity, "title",
                                                          "") or "Unknown"

    # аватар у base64 (не обов'язково, але вже є)
    raw = await client.download_profile_photo(entity, file=bytes)
    photo_b64 = ""
    if raw:
        photo_b64 = "data:image/jpeg;base64," + base64.b64encode(raw).decode()

    info = {"name": name, "photo": photo_b64}
    _USER_CACHE[uid] = (info, now + USER_TTL)
    return info


@router.get("/messages/{chat_id}")
async def get_messages(
        chat_id: int,
        phone: str,
        page: int = 0,  # 0 – останні, 1 – попередня сторінка тощо
        size: int = 30,
        db: AsyncSession = Depends(get_db),
):
    client = await _get_client(phone, db)

    # ――― читаємо size+1 шт. ↓ від самого КІНЦЯ (reverse=False за замовч.)
    raw = [
        m async for m in client.iter_messages(
            chat_id,
            limit=size + 1,  # на 1 більше, щоб дізнатись «has_next»
            add_offset=page * size,  # пропускаємо page·size від КІНЦЯ
            reverse=False  # оставляємо порядок newest→oldest
        )
    ]
    msgs = raw[:size]  # рівно size для віддачі
    has_next = len(raw) > size  # ще є старіші?
    has_prev = page > 0  # є новіші (нижче)

    # ---- автори одним запитом + кеш ----
    uids = {m.sender_id for m in msgs if m.sender_id}
    user_map = {uid: await _get_entity_cached(client, uid) for uid in uids}

    await client.disconnect()

    return {
        "page":
        page,
        "size":
        size,
        "has_next":
        has_next,
        "has_prev":
        has_prev,
        "messages": [{
            "id":
            m.id,
            "sender_id":
            m.sender_id,
            "sender_name":
            user_map.get(m.sender_id, {}).get("name", ""),
            "text":
            m.message or "",
            "date":
            m.date.isoformat(),
        } for m in msgs]
    }


@router.get("/chat_photo/{chat_id}")
async def chat_photo(chat_id: int,
                     phone: str,
                     db: AsyncSession = Depends(get_db)):
    b64, ttl = _photo_cache.get(chat_id, ("", datetime.utcnow()))
    if ttl > datetime.utcnow():
        return {"photo": b64}

    try:
        client = await _get_client(phone, db)
        entity = await client.get_entity(chat_id)
        raw = await client.download_profile_photo(entity, file=bytes)
        await client.disconnect()
    except Exception:
        return {"photo": ""}

    if not raw:
        return {"photo": ""}

    b64 = "data:image/jpeg;base64," + base64.b64encode(raw).decode()
    _photo_cache[chat_id] = (b64, datetime.utcnow() + CACHE_TTL)
    return {"photo": b64}


@router.post("/logout")
async def logout_telegram(phone: str, db: AsyncSession = Depends(get_db)):
    client = await _get_client(phone, db)
    await client.log_out()
    await client.disconnect()

    result = await db.execute(
        select(TelegramSession).where(TelegramSession.phone == phone))
    rec = result.scalars().first()
    if rec:
        await db.delete(rec)
        await db.commit()

    return {"message": "Logged out from Telegram"}
