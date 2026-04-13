# ===========================================================
# Message 对话消息表
# ===========================================================

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, Boolean, DateTime, ForeignKey, Uuid, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

import enum


class MessageType(str, enum.Enum):
    USER = "user"
    AI = "ai"
    SYSTEM = "system"


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rooms.id", ondelete="CASCADE"), index=True)
    sender_id: Mapped[str] = mapped_column(String(100))  # userId 或 agentId
    sender_name: Mapped[str] = mapped_column(String(100))
    sender_role: Mapped[str] = mapped_column(String(50), default="")
    message_type: Mapped[MessageType] = mapped_column(SAEnum(MessageType, native_enum=False, length=20))
    content: Mapped[str] = mapped_column(Text)
    # 关联的流程环节（可选，记录是哪个ThinkLet步骤中产生的消息）
    step_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("workflow_steps.id"), nullable=True)
    is_adopted: Mapped[bool] = mapped_column(Boolean, default=False)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    # 关系
    room = relationship("Room", back_populates="messages")
