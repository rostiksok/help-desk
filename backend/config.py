from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    database_url: str = "sqlite:///./helpdesk.db"
    allowed_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
