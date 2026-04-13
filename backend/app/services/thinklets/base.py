# ===========================================================
# ThinkLet 基类 — 所有6种ThinkLet的公共接口
# ===========================================================

from abc import ABC, abstractmethod
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.workflow import WorkflowStep, StepStatus
from app.models.idea import Idea


class BaseThinkLetService(ABC):
    """
    所有ThinkLet服务的基类，定义统一的生命周期接口。
    
    生命周期：
    1. start_step() — 开始环节（设状态为active）
    2. 执行各ThinkLet特有逻辑（子类实现）
    3. end_step() — 结束环节（设状态为completed，触摊摘要）
    """

    @staticmethod
    async def start_step(db: AsyncSession, step_id: UUID) -> WorkflowStep:
        """激活环节"""
        step = await db.get(WorkflowStep, step_id)
        if not step:
            raise ValueError(f"Step {step_id} not found")
        step.status = StepStatus.ACTIVE
        await db.flush()
        return step

    @staticmethod
    async def end_step(db: AsyncSession, step_id: UUID) -> WorkflowStep:
        """结束环节"""
        step = await db.get(WorkflowStep, step_id)
        if not step:
            raise ValueError(f"Step {step_id} not found")
        step.status = StepStatus.COMPLETED
        await db.flush()
        return step

    @staticmethod
    async def get_step_ideas(db: AsyncSession, step_id: UUID) -> list[Idea]:
        """获取某环节的所有观点"""
        result = await db.execute(
            select(Idea).where(Idea.step_id == step_id).order_by(Idea.created_at)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_selected_ideas(db: AsyncSession, step_id: UUID) -> list[Idea]:
        """获取某环节被选中的观点"""
        result = await db.execute(
            select(Idea)
            .where(Idea.step_id == step_id, Idea.is_selected == True)
            .order_by(Idea.created_at)
        )
        return list(result.scalars().all())

    @staticmethod
    async def carry_over_ideas(
        db: AsyncSession,
        from_step_id: UUID,
        to_step_id: UUID,
        room_id: UUID,
        only_selected: bool = True,
    ) -> list[Idea]:
        """
        将上一环节的观点搬运到下一环节。
        所有ThinkLet之间流转的核心公共操作。

        TODO: 根据 only_selected 决定是搬全部还是仅搬已选中的
        """
        if only_selected:
            source_ideas = await BaseThinkLetService.get_selected_ideas(db, from_step_id)
        else:
            source_ideas = await BaseThinkLetService.get_step_ideas(db, from_step_id)

        new_ideas = []
        for idea in source_ideas:
            new_idea = Idea(
                room_id=room_id,
                step_id=to_step_id,
                content=idea.content,
                source_id=idea.source_id,
                source_name=idea.source_name,
                source_type=idea.source_type,
                source_color=idea.source_color,
            )
            db.add(new_idea)
            new_ideas.append(new_idea)

        await db.flush()
        return new_ideas
