from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

fake_users_db = {}


class UserRegister(BaseModel):
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


@router.post("/register")
def register(user: UserRegister):
    if user.username in fake_users_db:
        raise HTTPException(status_code=400, detail="User already exists")

    fake_users_db[user.username] = {"password": user.password}
    return {"message": "User registered successfully"}


@router.post("/login")
def login(user: UserLogin):
    db_user = fake_users_db.get(user.username)
    if not db_user or db_user["password"] != user.password:
        raise HTTPException(status_code=400,
                            detail="Invalid username or password")

    return {"message": "Login successful", "username": user.username}
