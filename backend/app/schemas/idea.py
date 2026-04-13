# ===========================================================
# Idea 观点 Pydantic Schemas — 所有ThinkLets共享
# ===========================================================

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class IdeaCreate(BaseModel):
    """创建观点（手动添加 / AI提取）"""
    content: str
    step_id: UUID | None = None
    source_type: str = "user"  # "user" | "ai"
    round: int = 1
    parent_idea_id: UUID | None = None


class IdeaOut(BaseModel):
    id: UUID
    room_id: UUID
    step_id: UUID | None = None
    content: str
    source_id: str
    source_name: str
    source_type: str
    source_color: str
    round: int
    parent_idea_id: UUID | None = None
    is_selected: bool
    cluster_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class IdeaUpdate(BaseModel):
    content: str | None = None
    is_selected: bool | None = None
    cluster_id: str | None = None


class ClusterOut(BaseModel):
    cluster_id: str
    label: str
    idea_ids: list[UUID]


class BucketOut(BaseModel):
    id: UUID
    label: str
    description: str
    color: str
    order: int
    idea_ids: list[UUID] = []

    model_config = {"from_attributes": True}


class PollResultOut(BaseModel):
    idea_id: UUID
    total_points: int
    voter_count: int
    rank: int
