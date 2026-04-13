# ===========================================================
# WorkflowStep 流程步骤表
# ===========================================================

import uuid

from sqlalchemy import String, Integer, Text, ForeignKey, Uuid, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

import enum


class ThinkLetType(str, enum.Enum):
    FREE_BRAINSTORM = "FreeBrainstorm"
    LEAF_HOPPER = "LeafHopper"
    FAST_FOCUS = "FastFocus"
    BUCKET_WALK = "BucketWalk"
    POPCORN_SORT = "PopcornSort"
    STRAW_POLL = "StrawPoll"
    SIX_HATS = "SixHats"
    SUMMARY = "Summary"
    SWOT = "SWOT"


class StepStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rooms.id", ondelete="CASCADE"), index=True)
    thinklet_type: Mapped[ThinkLetType] = mapped_column(SAEnum(ThinkLetType, native_enum=False, length=30))
    title: Mapped[str] = mapped_column(String(200))
    prompt: Mapped[str] = mapped_column(Text, default="")
    duration_minutes: Mapped[int] = mapped_column(Integer, default=10)
    order: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[StepStatus] = mapped_column(SAEnum(StepStatus, native_enum=False, length=20), default=StepStatus.PENDING)

    # LeafHopper特有：轮数配置
    round_count: Mapped[int] = mapped_column(Integer, default=1)

    # BucketWalk特有：预设桶数
    bucket_count: Mapped[int] = mapped_column(Integer, default=0)

    # StrawPoll特有：每人可用票数/点数
    points_per_voter: Mapped[int] = mapped_column(Integer, default=5)

    # 关系
    room = relationship("Room", back_populates="workflow_steps")
    ideas = relationship("Idea", back_populates="step", lazy="noload")
    buckets = relationship("Bucket", back_populates="step", lazy="noload")
