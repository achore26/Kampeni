from pydantic_settings import BaseSettings
from functools import lru_cache


class TranslationSettings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"

    # External translation API — set by the other engineer when ready
    # Leave blank to use the mock implementation
    translation_api_url: str = ""
    translation_api_key: str = ""

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
