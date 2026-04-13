# ===========================================================
# User Pydantic Schemas
# ===========================================================

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


class UserRegister(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    display_name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)
    email: str | None = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserInfo(BaseModel):
    id: UUID
    username: str
    display_name: str
    avatar: str
    avatar_bg: str
    email: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo
