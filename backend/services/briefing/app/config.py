from pydantic_settings import BaseSettings


class BriefingSettings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    openai_api_key: str = ""
    at_api_key: str = ""  # Africa's Talking for SMS fallback
    at_username: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"
