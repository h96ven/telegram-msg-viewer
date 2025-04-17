from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    secret_key: str = Field(..., env="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    database_url: str = Field(..., env="DATABASE_URL")


settings = Settings()
