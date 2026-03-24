from pydantic_settings import BaseSettings


class IngestionSettings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"

    # Social APIs
    twitter_bearer_token: str = ""
    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_access_token: str = ""

    # AWS S3 for raw data archiving
    aws_region: str = "af-south-1"
    s3_raw_bucket: str = "kampeni-raw-data"

    class Config:
        env_file = ".env"
        extra = "ignore"
