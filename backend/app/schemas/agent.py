# ===========================================================
# Agent Pydantic Schemas
# ===========================================================

from pydantic import BaseModel, Field
from uuid import UUID


class AgentConfigCreate(BaseModel):
    model_id: str  # e.g. "deepseek-v3"
    role_template: str = "default"
    system_prompt: str = ""
    temperature: float = Field(0.7, ge=0, le=2)
    max_tokens: int = Field(2000, ge=500, le=4000)
    is_active: bool = True


class AgentConfigOut(BaseModel):
    id: UUID
    model_id: str
    role_template: str
    system_prompt: str
    temperature: float
    max_tokens: int
    is_active: bool

    model_config = {"from_attributes": True}


class AgentConfigUpdate(BaseModel):
    role_template: str | None = None
    system_prompt: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    is_active: bool | None = None


class AgentChatRequest(BaseModel):
    """调用AI模型"""
    agent_id: str  # room中的agent_config_id或模型ID
    messages: list[dict]  # [{"role": "system"|"user"|"assistant", "content": "..."}]
    stream: bool = True


class AIDesignWorkflowRequest(BaseModel):
    """AI智能流程设计"""
    topic: str = Field(..., min_length=1)
