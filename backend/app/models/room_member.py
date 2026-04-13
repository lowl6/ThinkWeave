# ===========================================================
# RoomMember 房间成员关联表
# ===========================================================

import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Uuid, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

import enum


class MemberRole(str, enum.Enum):
    HOST = "host"
    MEMBER = "member"


class RoomMember(Base):
    __tablename__ = "room_members"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rooms.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    role: Mapped[MemberRole] = mapped_column(SAEnum(MemberRole, native_enum=False, length=20), default=MemberRole.MEMBER)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # 关系
    room = relationship("Room", back_populates="members")
    user = relationship("User", back_populates="memberships", lazy="selectin")
