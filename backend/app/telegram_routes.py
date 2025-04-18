from app.config import settings
from app.database import get_db
from app.models import TelegramSession
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from telethon import errors
from telethon.sessions import StringSession
from telethon.sync import TelegramClient

router = APIRouter()

API_ID = settings.telegram_api_id
API_HASH = settings.telegram_api_hash


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

    session_str = client.session.save()
    await client.disconnect()

    rec.session_str = session_str
    await db.commit()

    pending.pop(phone, None)

    return {"message": "Telegram account connected successfully"}


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


@router.get("/chats")
async def get_chats(phone: str, db: AsyncSession = Depends(get_db)):
    client = await _get_client(phone, db)
    dialogs = await client.get_dialogs()
    await client.disconnect()
    return {
        "chats": [{
            "name": d.name or d.title or "Untitled",
            "id": d.id
        } for d in dialogs]
    }


@router.get("/messages/{chat_id}")
async def get_messages(chat_id: int,
                       phone: str,
                       db: AsyncSession = Depends(get_db)):
    client = await _get_client(phone, db)
    messages = []
    async for msg in client.iter_messages(chat_id, limit=50):
        messages.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "text": msg.message,
            "date": str(msg.date),
        })
    await client.disconnect()
    return {"messages": messages}


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
