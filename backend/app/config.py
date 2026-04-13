# ===========================================================
# ThinkWeave 后端配置 — 环境变量加载
# ===========================================================

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ---- 数据库 ----
    # 默认使用 SQLite（零配置），可在 .env 中切换为 MySQL:
    #   DATABASE_URL=mysql+asyncmy://root:password@localhost:3306/thinkweave
    DATABASE_URL: str = "sqlite+aiosqlite:///./thinkweave.db"

    # ---- JWT ----
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24h

    # ---- AI 网关 ----
    AI_GATEWAY_BASE_URL: str = "https://aihubmix.com/v1"
    AI_GATEWAY_API_KEY: str = ""

    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = ""
    WENXIN_API_KEY: str = ""
    WENXIN_BASE_URL: str = ""
    QIANWEN_API_KEY: str = ""
    QIANWEN_BASE_URL: str = ""
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""

    # ---- 文件 ----
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB

    # ---- CORS ----
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
