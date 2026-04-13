# ===========================================================
# ThinkWeave 后端入口
# ===========================================================

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import engine, Base
from app.api.auth import router as auth_router
from app.api.rooms import router as rooms_router
from app.api.thinklets import router as thinklets_router
from app.api.ideas import router as ideas_router
from app.api.chat import router as chat_router
from app.api.knowledge import router as knowledge_router

settings = get_settings()

# 前端静态文件目录（frontend/public/ 中的原型 HTML 页面）
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "public"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动：创建数据库表（开发环境用，生产应使用Alembic迁移）
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # 关闭
    await engine.dispose()


app = FastAPI(
    title="ThinkWeave API",
    description="多AI人机协作研讨平台后端 — 支持6种ThinkLets",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS（同源部署，放宽限制）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API 路由 ──────────────────────────────────────────────
app.include_router(auth_router, prefix="/api")
app.include_router(rooms_router, prefix="/api")
app.include_router(thinklets_router, prefix="/api")
app.include_router(ideas_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(knowledge_router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "ThinkWeave Backend"}


# ── Socket.IO ─────────────────────────────────────────────
from app.realtime import sio_app as _sio_app  # noqa: E402
app.mount("/ws", _sio_app)


# ── 根路由 → 首页 ─────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/首页.html")


# ── 静态文件（HTML 原型页面）必须放在最后 ─────────────────
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
