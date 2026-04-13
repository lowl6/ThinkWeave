# ===========================================================
# Bucket — BucketWalk 分类桶定义表
# ===========================================================

import uuid

from sqlalchemy import String, Integer, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Bucket(Base):
    __tablename__ = "buckets"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rooms.id", ondelete="CASCADE"), index=True)
    step_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("workflow_steps.id"), index=True)
    label: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[str] = mapped_column(String(20), default="#8b5cf6")
    order: Mapped[int] = mapped_column(Integer, default=0)

    # 关系
    room = relationship("Room", back_populates="buckets")
    step = relationship("WorkflowStep", back_populates="buckets")
    assignments = relationship("BucketAssignment", back_populates="bucket", lazy="selectin", cascade="all, delete-orphan")
