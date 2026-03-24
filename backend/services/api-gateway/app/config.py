from pydantic_settings import BaseSettings


class GatewaySettings(BaseSettings):
    sentiment_service_url: str = "http://sentiment:8001"
    opponent_service_url: str = "http://opponent:8002"
    briefing_service_url: str = "http://briefing:8003"

    class Config:
        env_file = ".env"
        extra = "ignore"
