from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "robolab_super_secret_key_2024_change_in_production_xyz"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    DATABASE_URL: str = "sqlite:////tmp/robolab_erp.db" if os.environ.get("VERCEL") else "sqlite:///./robolab_erp.db"  # Vercel usa /tmp para SQLite temporal
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    UPLOAD_DIR: str = "./uploads"

    def get_db_url(self):
        """Vercel Postgres expone POSTGRES_URL. Si existe, preferirla sobre SQLite."""
        for env in ["POSTGRES_URL", "POSTGRES_PRISMA_URL", "DATABASE_URL"]:
            val = os.environ.get(env)
            if val and "postgres" in val.lower():
                if val.startswith("postgres://"):
                    val = val.replace("postgres://", "postgresql+psycopg2://", 1)
                elif val.startswith("postgresql://") and "+psycopg2" not in val:
                    val = val.replace("postgresql://", "postgresql+psycopg2://", 1)
                
                # Psycopg2 does not support "supa=" or "pgbouncer=" connection options.
                if "?" in val:
                    val = val.split("?")[0]
                
                return val
        db_url = self.DATABASE_URL
        if os.environ.get("VERCEL") and db_url.startswith("sqlite") and "/tmp/" not in db_url:
            return "sqlite:////tmp/robolab_erp.db"
        return db_url

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
if os.environ.get("VERCEL"):
    settings.UPLOAD_DIR = "/tmp/uploads"

try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except Exception:
    pass

# Agregamos dinámicamente orígenes CORS de variables Vercel
_vercel_url = os.environ.get("VERCEL_URL") or os.environ.get("FRONTEND_URL")
if _vercel_url:
    if not _vercel_url.startswith("http"):
        _vercel_url = f"https://{_vercel_url}"
    if _vercel_url not in settings.BACKEND_CORS_ORIGINS:
        settings.BACKEND_CORS_ORIGINS.append(_vercel_url)

