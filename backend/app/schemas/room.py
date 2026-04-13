# ===========================================================
# Room Pydantic Schemas
# ===========================================================

from pydantic import BaseModel, Field, model_validator
from uuid import UUID
from datetime import datetime

from app.schemas.workflow import WorkflowStepCreate, WorkflowStepOut
from app.schemas.agent import AgentConfigCreate, AgentConfigOut


class RoomCreate(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500)
    password: str | None = None
    agents: list[AgentConfigCreate] = []
    workflow: list[WorkflowStepCreate] = []


class RoomJoin(BaseModel):
    room_code: str = Field(..., pattern=r"^\d{9}$")
    password: str | None = None


class MemberOut(BaseModel):
    id: UUID
    user_id: UUID
    display_name: str = ""
    avatar: str = ""
    avatar_bg: str = ""
    role: str
    is_online: bool
    joined_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def populate_user_fields(cls, data):
        """从 RoomMember ORM 对象中取 user 关系的字段"""
        if hasattr(data, "user") and data.user:
            user = data.user
            return {
                "id": data.id,
                "user_id": data.user_id,
                "display_name": user.display_name,
                "avatar": user.avatar,
                "avatar_bg": user.avatar_bg,
                "role": data.role.value if hasattr(data.role, "value") else data.role,
                "is_online": data.is_online,
                "joined_at": data.joined_at,
            }
        return data


class RoomOut(BaseModel):
    id: UUID
    room_code: str
    topic: str
    created_by: UUID
    status: str
    elapsed_seconds: int
    created_at: datetime
    members: list[MemberOut] = []
    agent_configs: list[AgentConfigOut] = []
    workflow_steps: list[WorkflowStepOut] = []

    model_config = {"from_attributes": True}


class RoomUpdate(BaseModel):
    topic: str | None = None
    status: str | None = None
