from functools import lru_cache

from pydantic_settings import BaseSettings


class BriefingSettings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"

    # PostgreSQL — shared DB for querying articles, sentiment, opponents, painpoints
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "kampeni"
    postgres_user: str = "kampeni"
    postgres_password: str = "kampeni_dev"

    # OpenAI GPT-4o — briefing generation
    openai_api_key: str = ""

    # Africa's Talking — SMS delivery
    at_api_key: str = ""
    at_username: str = ""

    # Briefing config
    # Comma-separated candidate IDs to generate briefings for.
    # At MVP scale there's typically one candidate per installation.
    candidate_ids: str = "default"
    briefing_language: str = "sw"  # sw | en

    @property
    def postgres_dsn_sync(self) -> str:
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> BriefingSettings:
    return BriefingSettings()
