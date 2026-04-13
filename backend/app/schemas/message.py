# ===========================================================
# Message Pydantic Schemas
# ===========================================================

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class MessageSend(BaseModel):
    room_id: UUID
    content: str
    target_agent_ids: list[str] = []  # 指定哪些Agent响应


class MessageOut(BaseModel):
    id: UUID
    room_id: UUID
    sender_id: str
    sender_name: str
    sender_role: str
    message_type: str
    content: str
    step_id: UUID | None = None
    is_adopted: bool = False
    score: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageScore(BaseModel):
    score: int


class MessageAdopt(BaseModel):
    pass
