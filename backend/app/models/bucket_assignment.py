# ===========================================================
# BucketAssignment — 桶归类映射表
# ===========================================================

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BucketAssignment(Base):
    __tablename__ = "bucket_assignments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    idea_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("ideas.id", ondelete="CASCADE"), index=True)
    bucket_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("buckets.id", ondelete="CASCADE"), index=True)
    assigned_by: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"))
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # 关系
    idea = relationship("Idea", back_populates="bucket_assignments")
    bucket = relationship("Bucket", back_populates="assignments")
