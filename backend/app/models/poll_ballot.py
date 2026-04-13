# ===========================================================
# PollBallot — StrawPoll 投票表
# ===========================================================

import uuid
from datetime import datetime

from sqlalchemy import Integer, DateTime, ForeignKey, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PollBallot(Base):
    __tablename__ = "poll_ballots"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    idea_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("ideas.id", ondelete="CASCADE"), index=True)
    voter_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    step_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("workflow_steps.id"), index=True)
    points: Mapped[int] = mapped_column(Integer, default=1)  # 分配的点数
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # 关系
    idea = relationship("Idea", back_populates="poll_ballots")
