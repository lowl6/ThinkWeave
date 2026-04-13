# ===========================================================
# AgentConfig AI Agent配置表
# ===========================================================

import uuid

from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AgentConfig(Base):
    __tablename__ = "agent_configs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("rooms.id", ondelete="CASCADE"), index=True)
    model_id: Mapped[str] = mapped_column(String(50))  # e.g. "deepseek-v3"
    role_template: Mapped[str] = mapped_column(String(50), default="default")
    system_prompt: Mapped[str] = mapped_column(Text, default="")
    temperature: Mapped[float] = mapped_column(Float, default=0.7)
    max_tokens: Mapped[int] = mapped_column(Integer, default=2000)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # 关系
    room = relationship("Room", back_populates="agent_configs")
    knowledge_files = relationship("KnowledgeFile", back_populates="agent_config", lazy="selectin", cascade="all, delete-orphan")
