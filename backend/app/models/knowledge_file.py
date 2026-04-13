# ===========================================================
# KnowledgeFile 知识库文件表
# ===========================================================

import uuid
from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class KnowledgeFile(Base):
    __tablename__ = "knowledge_files"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    agent_config_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("agent_configs.id", ondelete="CASCADE"), index=True)
    file_name: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(String(500))  # 存储路径
    file_size: Mapped[int] = mapped_column(Integer)
    mime_type: Mapped[str] = mapped_column(String(100))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # 关系
    agent_config = relationship("AgentConfig", back_populates="knowledge_files")
