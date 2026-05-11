from pydantic_settings import BaseSettings
from functools import lru_cache

TARJUMI_BASE_URL = "https://api.thexi.dev"


class TranslationSettings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"

    # Tarjumi API key — set TARJUMI_API_KEY in .env
    # Leave blank to use the mock/langdetect fallback
    tarjumi_api_key: str = ""

    # MinIO / S3
    minio_endpoint: str = "http://localhost:9000"
    minio_access_key: str = "kampeni"
    minio_secret_key: str = "kampeni_dev_secret"
    minio_bucket: str = "kampeni-raw"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> TranslationSettings:
    return TranslationSettings()
