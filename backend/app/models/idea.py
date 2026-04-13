# ===========================================================
# Idea 观点/灵感表 — 所有ThinkLets共享的核心表
# ===========================================================

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, Boolean, DateTime, ForeignKey, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Idea(Base):
    """
    所有ThinkLets环节产出的观点统一存储在此表。
    
    - FreeBrainstorm / LeafHopper: 生成的观点
    - FastFocus: 被评审的观点 + 投票关联
    - BucketWalk: 被归类的观点 + 桶映射
    - PopcornSort: 被筛选的观点
    - StrawPoll: 被投票的观点
    """
    __tablename__ = "ideas"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rooms.id", ondelete="CASCADE"), index=True)
    step_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("workflow_steps.id"), nullable=True, index=True)
    content: Mapped[str] = mapped_column(Text)
    source_id: Mapped[str] = mapped_column(String(100))  # userId 或 agentId
    source_name: Mapped[str] = mapped_column(String(100))
    source_type: Mapped[str] = mapped_column(String(10), default="user")  # "user" | "ai"
    source_color: Mapped[str] = mapped_column(String(20), default="#6b7280")

    # LeafHopper 跳跃链路
    round: Mapped[int] = mapped_column(Integer, default=1)
    parent_idea_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("ideas.id"), nullable=True)

    # 筛选结果
    is_selected: Mapped[bool] = mapped_column(Boolean, default=False)
    cluster_id: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # 关系
    room = relationship("Room", back_populates="ideas")
    step = relationship("WorkflowStep", back_populates="ideas")
    parent_idea = relationship("Idea", remote_side=[id], lazy="noload")
    votes = relationship("IdeaVote", back_populates="idea", lazy="noload", cascade="all, delete-orphan")
    bucket_assignments = relationship("BucketAssignment", back_populates="idea", lazy="noload", cascade="all, delete-orphan")
    poll_ballots = relationship("PollBallot", back_populates="idea", lazy="noload", cascade="all, delete-orphan")
