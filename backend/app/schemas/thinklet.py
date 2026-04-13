# ===========================================================
# ThinkLet 操作 Pydantic Schemas — 各环节专有操作
# ===========================================================

from pydantic import BaseModel, Field
from uuid import UUID


# ---- FastFocus 投票 ----

class FastFocusVoteRequest(BaseModel):
    """FastFocus: 对单条观点投票"""
    idea_id: UUID
    vote_type: str  # "keep" | "merge" | "discard"
    comment: str | None = None


class FastFocusResult(BaseModel):
    idea_id: UUID
    content: str
    keep_count: int
    merge_count: int
    discard_count: int
    final_status: str  # "kept" | "merged" | "discarded"


# ---- BucketWalk 桶操作 ----

class BucketCreate(BaseModel):
    label: str = Field(..., max_length=200)
    description: str = ""
    color: str = "#8b5cf6"


class BucketAssignRequest(BaseModel):
    """BucketWalk: 将观点分配到桶"""
    idea_id: UUID
    bucket_id: UUID


class BucketAutoClassifyRequest(BaseModel):
    """BucketWalk: AI自动归类"""
    step_id: UUID


# ---- PopcornSort 筛选 ----

class PopcornSortSelectRequest(BaseModel):
    """PopcornSort: 批量选中/取消选中"""
    idea_ids: list[UUID]
    is_selected: bool


class PopcornSortClusterRequest(BaseModel):
    """PopcornSort: 触发AI语义聚类"""
    step_id: UUID


class PopcornSortMergeRequest(BaseModel):
    """PopcornSort: 合并相似观点"""
    cluster_id: str
    merged_content: str | None = None  # 为空则AI生成


# ---- StrawPoll 投票 ----

class StrawPollBallotRequest(BaseModel):
    """StrawPoll: 投票（分配点数给某条观点）"""
    idea_id: UUID
    points: int = Field(..., ge=1)


class StrawPollBatchBallot(BaseModel):
    """StrawPoll: 批量提交投票"""
    ballots: list[StrawPollBallotRequest]


# ---- LeafHopper 接龙 ----

class LeafHopperContribution(BaseModel):
    """LeafHopper: 基于某观点发散新想法"""
    parent_idea_id: UUID
    content: str
    round: int


class LeafHopperAIExpandRequest(BaseModel):
    """LeafHopper: AI基于选中观点拓展"""
    parent_idea_ids: list[UUID]
    agent_ids: list[str] = []
    count_per_agent: int = 3
