from app.auth import router as auth_router
from app.telegram_routes import router as telegram_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(telegram_router, prefix="/telegram", tags=["telegram"])


@app.get("/")
def root():
    return {"message": "Hello from FastAPI"}
