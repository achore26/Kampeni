from pydantic_settings import BaseSettings


class GatewaySettings(BaseSettings):
    sentiment_service_url: str = "http://sentiment:8001"
    opponent_service_url: str = "http://opponent:8002"
    briefing_service_url: str = "http://briefing:8003"
    ingestion_service_url: str = "http://ingestion:8004"
    translation_service_url: str = "http://translation:8005"
    painpoint_service_url: str = "http://painpoint:8006"

    resend_api_key: str = ""
    email_from_address: str = "noreply@kampeni.net"
    email_from_name: str = "Kampeni"

    anthropic_api_key: str = ""
    internal_api_base: str = "http://localhost:8000"
    tarjumi_api_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = GatewaySettings()
