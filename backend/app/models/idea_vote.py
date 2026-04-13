# ===========================================================
# IdeaVote — FastFocus 快速聚焦投票表
# ===========================================================

import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Uuid, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

import enum


class VoteType(str, enum.Enum):
    KEEP = "keep"
    MERGE = "merge"
    DISCARD = "discard"


class IdeaVote(Base):
    __tablename__ = "idea_votes"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    idea_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("ideas.id", ondelete="CASCADE"), index=True)
    voter_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"))
    vote_type: Mapped[VoteType] = mapped_column(SAEnum(VoteType, native_enum=False, length=20))
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # 关系
    idea = relationship("Idea", back_populates="votes")
