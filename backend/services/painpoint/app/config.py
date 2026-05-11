from functools import lru_cache

from pydantic_settings import BaseSettings


class PainPointSettings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    database_url: str = "postgresql://kampeni:kampeni_dev@localhost:5432/kampeni"

    # Anthropic API — leave blank to use rule-based fallback
    anthropic_api_key: str = ""

    # Tarjumi API — used to expand issue keywords into Kikuyu, Luo, Kamba
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
def get_settings() -> PainPointSettings:
    return PainPointSettings()
