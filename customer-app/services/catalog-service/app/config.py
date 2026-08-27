from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    redis_url: str
    env: str = "dev"
    catalog_service_port: int = 8000
    otel_service_name: str = "catalog-service"
    otel_exporter_otlp_endpoint: str = "http://localhost:4317"


settings = Settings()
