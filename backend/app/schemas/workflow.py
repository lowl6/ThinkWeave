# ===========================================================
# Workflow Pydantic Schemas
# ===========================================================

from typing import Literal

from pydantic import BaseModel, Field
from uuid import UUID


class WorkflowStepCreate(BaseModel):
    thinklet_type: Literal[
        "FreeBrainstorm",
        "LeafHopper",
        "FastFocus",
        "BucketWalk",
        "PopcornSort",
        "StrawPoll",
        "SixHats",
        "Summary",
        "SWOT",
    ]
    title: str = Field(..., max_length=200)
    prompt: str = ""
    duration_minutes: int = Field(10, ge=1, le=120)
    # 各ThinkLet特有配置
    round_count: int = Field(1, ge=1, le=10)  # LeafHopper轮数
    bucket_count: int = Field(0, ge=0, le=20)  # BucketWalk桶数
    points_per_voter: int = Field(5, ge=1, le=20)  # StrawPoll票数


class WorkflowStepOut(BaseModel):
    id: UUID
    thinklet_type: str
    title: str
    prompt: str
    duration_minutes: int
    order: int
    status: str
    round_count: int
    bucket_count: int
    points_per_voter: int

    model_config = {"from_attributes": True}


class WorkflowStepUpdate(BaseModel):
    title: str | None = None
    prompt: str | None = None
    duration_minutes: int | None = None
    status: str | None = None
