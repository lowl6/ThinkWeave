# ===========================================================
# RoomState 房间内共享键值对（前端 ScopedStorage 的后端持久化）
#
# 用于在同一房间的不同用户/设备之间共享数据：
# - bs_chat       头脑风暴聊天历史
# - bs_ideas      头脑风暴灵感池
# - step_{n}      第 n 步的步骤结果
# - timeline      已完成步骤索引列表
# - workflow      房间 workflow 配置（标题/时长等）
# - ideas         通用 shared_ideas
# 等等。前端用 version 字段做轻量轮询变化检测。
# ===========================================================

import uuid
from datetime import datetime

from sqlalchemy import (
    String, Text, Integer, DateTime, ForeignKey, Uuid, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RoomState(Base):
    __tablename__ = "room_states"
    __table_args__ = (
        UniqueConstraint("room_id", "key", name="uq_room_states_room_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("rooms.id", ondelete="CASCADE"), index=True
    )
    key: Mapped[str] = mapped_column(String(64), index=True)
    value: Mapped[str] = mapped_column(Text, default="null")  # JSON 字符串
    version: Mapped[int] = mapped_column(Integer, default=1)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
