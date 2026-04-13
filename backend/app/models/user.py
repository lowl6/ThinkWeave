# ===========================================================
# User 用户表
# ===========================================================

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(100))
    avatar: Mapped[str] = mapped_column(String(10), default="")  # 头像文字(1-2字)
    avatar_bg: Mapped[str] = mapped_column(String(100), default="bg-blue-500")
    hashed_password: Mapped[str] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # 关系
    memberships = relationship("RoomMember", back_populates="user", lazy="selectin")
    subscription = relationship("Subscription", back_populates="user", uselist=False, lazy="selectin")
