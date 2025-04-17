from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from telethon import errors
from telethon.sync import TelegramClient

router = APIRouter()

API_ID = 123456
API_HASH = "your_api_hash_here"

telegram_clients = {}


class PhoneNumber(BaseModel):
    phone: str


class CodeData(BaseModel):
    phone: str
    code: str


@router.post("/connect")
async def connect_telegram(phone_data: PhoneNumber):
    phone = phone_data.phone
    client = TelegramClient(f"session_{phone}", API_ID, API_HASH)
    await client.connect()

    try:
        if not await client.is_user_authorized():
            await client.send_code_request(phone)
            telegram_clients[phone] = client

            return {"message": "Code sent"}

        else:
            return {"message": "Already authorized"}

    except errors.PhoneNumberInvalidError:
        raise HTTPException(status_code=400, detail="Invalid phone number")


@router.post("/verify")
async def verify_code(code_data: CodeData):
    phone = code_data.phone
    code = code_data.code

    client = telegram_clients.get(phone)
    if not client:
        raise HTTPException(status_code=400, detail="Session not found")

    try:
        await client.sign_in(phone, code)
        return {"message": "Telegram account connected successfully"}

    except errors.SessionPasswordNeededError:
        raise HTTPException(status_code=401,
                            detail="Two-step verification required")

    except errors.CodeInvalidError:
        raise HTTPException(status_code=400, detail="Invalid code")


@router.get("/chats")
async def get_chats(phone: str):
    client = telegram_clients.get(phone)
    if not client:
        raise HTTPException(status_code=401, detail="Not authenticated")

    dialogs = await client.get_dialogs()
    chats = []
    for d in dialogs:
        chats.append({"name": d.name, "id": d.id})

    return {"chats": chats}


@router.get("/messages/{chat_id}")
async def get_messages(phone: str, chat_id: int):
    client = telegram_clients.get(phone)
    if not client:
        raise HTTPException(status_code=401, detail="Not authenticated")

    messages = []
    async for msg in client.iter_messages(chat_id, limit=50):
        messages.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "text": msg.message,
            "date": str(msg.date)
        })

    return {"messages": messages}


@router.post("/logout")
async def logout_telegram(phone: str):
    client = telegram_clients.get(phone)
    if not client:
        raise HTTPException(status_code=401, detail="Not authenticated")

    await client.log_out()
    await client.disconnect()
    telegram_clients.pop(phone, None)

    return {"message": "Logged out from Telegram"}
