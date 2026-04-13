# ===========================================================
# Room 房间表
# ===========================================================

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Integer, Uuid, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

import enum


class RoomStatus(str, enum.Enum):
    WAITING = "waiting"
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    room_code: Mapped[str] = mapped_column(String(9), unique=True, index=True)  # 9位数字
    topic: Mapped[str] = mapped_column(String(500))
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)  # 为空=公开
    created_by: Mapped[uuid.UUID] = mapped_column(Uuid)  # 创建者userId
    status: Mapped[RoomStatus] = mapped_column(SAEnum(RoomStatus, native_enum=False, length=20), default=RoomStatus.WAITING)
    elapsed_seconds: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # 关系
    members = relationship("RoomMember", back_populates="room", lazy="selectin", cascade="all, delete-orphan")
    agent_configs = relationship("AgentConfig", back_populates="room", lazy="selectin", cascade="all, delete-orphan")
    workflow_steps = relationship("WorkflowStep", back_populates="room", lazy="selectin", order_by="WorkflowStep.order", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="room", lazy="noload", cascade="all, delete-orphan")
    ideas = relationship("Idea", back_populates="room", lazy="noload", cascade="all, delete-orphan")
    buckets = relationship("Bucket", back_populates="room", lazy="noload", cascade="all, delete-orphan")
