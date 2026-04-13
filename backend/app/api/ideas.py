# ===========================================================
# 观点 CRUD 路由 — 公共操作
# ===========================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.idea import Idea
from app.schemas.idea import IdeaCreate, IdeaOut, IdeaUpdate

router = APIRouter(prefix="/ideas", tags=["观点"])


@router.post("", response_model=IdeaOut)
async def create_idea(
    data: IdeaCreate,
    room_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """手动创建观点"""
    idea = Idea(
        room_id=room_id,
        step_id=str(data.step_id) if data.step_id else None,
        content=data.content,
        source_id=str(user.id),
        source_name=user.display_name,
        source_type=data.source_type,
        source_color="#3b82f6",
        round=data.round,
        parent_idea_id=str(data.parent_idea_id) if data.parent_idea_id else None,
    )
    db.add(idea)
    await db.flush()
    return IdeaOut.model_validate(idea)


@router.patch("/{idea_id}", response_model=IdeaOut)
async def update_idea(
    idea_id: str,
    data: IdeaUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """更新观点（编辑内容/切换选中/设cluster）"""
    idea = await db.get(Idea, idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail="观点不存在")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(idea, field, value)

    await db.flush()
    return IdeaOut.model_validate(idea)


@router.delete("/{idea_id}")
async def delete_idea(
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """删除观点"""
    idea = await db.get(Idea, idea_id)
    if not idea:
        raise HTTPException(status_code=404, detail="观点不存在")
    await db.delete(idea)
    await db.flush()
    return {"deleted": True}
