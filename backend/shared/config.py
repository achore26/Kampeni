from functools import lru_cache
from pydantic import model_validator
from pydantic_settings import BaseSettings

_DEV_DEFAULTS = {
    "secret_key": "change-me",
    "postgres_password": "kampeni_dev",
    "minio_secret_key": "kampeni_dev_secret",
}


class Settings(BaseSettings):
    app_env: str = "development"
    log_level: str = "INFO"
    secret_key: str = "change-me"

    # Shared secret for Prefect → trigger endpoint calls (service-to-service only)
    internal_trigger_secret: str = ""

    # PostgreSQL
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "kampeni"
    postgres_user: str = "kampeni"
    postgres_password: str = "kampeni_dev"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    # Auth0
    auth0_domain: str = ""
    auth0_audience: str = ""

    # OpenAI
    openai_api_key: str = ""

    # Object Storage (MinIO locally, swap to S3 in production)
    minio_endpoint: str = "http://localhost:9000"
    minio_access_key: str = "kampeni"
    minio_secret_key: str = "kampeni_dev_secret"
    minio_bucket: str = "kampeni-raw"

    # Tarjumi — African language translation API (api.thexi.dev)
    tarjumi_api_key: str = ""

    # YouTube Data API v3
    youtube_api_key: str = ""

    # Africa's Talking
    at_api_key: str = ""
    at_username: str = ""

    # Facebook / Meta Graph API (legacy — only works if you admin the pages)
    meta_access_token: str = ""
    facebook_page_ids: str = ""

    # Facebook Playwright scraper — public page URLs (no login needed)
    # Comma-separated full URLs, e.g. "https://www.facebook.com/NationAfrica,..."
    # Leave empty to use the default Kenyan media/political pages baked into the scraper.
    fb_page_urls: str = ""

    # Facebook Playwright forager — keyword search (needs a real FB account)
    # Use a dedicated account, not a personal one. No 2FA.
    fb_email: str = ""
    fb_password: str = ""

    @property
    def postgres_dsn(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def postgres_dsn_sync(self) -> str:
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.app_env == "production":
            errors = []
            for field, dev_default in _DEV_DEFAULTS.items():
                if getattr(self, field) == dev_default:
                    errors.append(f"{field.upper()} must be changed from the development default in production")
            if not self.internal_trigger_secret:
                errors.append("INTERNAL_TRIGGER_SECRET must be set in production")
            if not self.auth0_domain or self.auth0_domain == "your-tenant.auth0.com":
                errors.append("AUTH0_DOMAIN must be set in production")
            if errors:
                raise ValueError("Production configuration errors:\n" + "\n".join(f"  - {e}" for e in errors))
        return self

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
