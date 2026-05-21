# ===========================================================
# RoomState Pydantic Schemas
# ===========================================================

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class RoomStateOut(BaseModel):
    """单个共享键的当前值。value 已反序列化为 Python/JSON 对象。"""
    key: str
    value: Any = None
    version: int
    updated_at: datetime

    model_config = {"from_attributes": True}


class RoomStateWrite(BaseModel):
    """写入请求体：value 是任意可 JSON 序列化的对象。"""
    value: Any = None


class RoomStateVersionsOut(BaseModel):
    """轻量轮询：仅返回每个 key 的版本号 + 更新时间。"""
    versions: dict[str, int] = {}
