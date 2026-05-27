from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 120
    cors_origins: str = "http://localhost:3000"
    rate_limit_per_minute: int = 60
    max_upload_size_mb: int = 10
    allowed_log_extensions: str = ".log,.txt,.json"

    class Config:
        env_file = "../.env"
        extra = "ignore"

    @property
    def cors_origins_list(self):
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def allowed_log_extension_list(self):
        return [ext.strip().lower() for ext in self.allowed_log_extensions.split(",")]

settings = Settings()
settings.cors_origins = settings.cors_origins_list
settings.allowed_log_extensions = settings.allowed_log_extension_list
