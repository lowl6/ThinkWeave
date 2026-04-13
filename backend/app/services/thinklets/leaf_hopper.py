# ===========================================================
# LeafHopper 接龙发散服务
# ===========================================================

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.idea import Idea
from app.services.thinklets.base import BaseThinkLetService
from app.services.shared.idea_extraction import IdeaExtractionService
from app.services.shared.idea_generation import IdeaGenerationService


class LeafHopperService(BaseThinkLetService):
    """
    接龙发散：多轮基于已有观点跳跃式发散。
    
    流程：
    1. start_step() 开始环节
    2. Round 1: 加载种子观点（来自上一环节或手动输入）
    3. Round N: 每人选择前一轮的观点 → 向新方向拓展 → add_user_contribution()
    4. AI基于选中观点拓展 → generate_ai_expansions()
    5. next_round() 切换到下一轮（直到达到round_count）
    6. end_step() 结束环节
    """

    @staticmethod
    async def get_round_ideas(
        db: AsyncSession,
        step_id: UUID,
        round_num: int,
    ) -> list[Idea]:
        """获取指定轮次的观点"""
        result = await db.execute(
            select(Idea)
            .where(Idea.step_id == step_id, Idea.round == round_num)
            .order_by(Idea.created_at)
        )
        return list(result.scalars().all())

    @staticmethod
    async def add_user_contribution(
        db: AsyncSession,
        room_id: UUID,
        step_id: UUID,
        user_id: str,
        user_name: str,
        content: str,
        round_num: int,
        parent_idea_id: UUID | None = None,
    ) -> list[Idea]:
        """
        用户基于某条观点发散新想法。

        TODO: 验证parent_idea_id存在且属于前一轮
        TODO: 用IdeaExtractionService提取观点
        """
        return await IdeaExtractionService.extract_and_save(
            db=db,
            text=content,
            room_id=str(room_id),
            step_id=str(step_id),
            source_id=user_id,
            source_name=user_name,
            source_type="user",
            source_color="#3b82f6",
            round_num=round_num,
            parent_idea_id=str(parent_idea_id) if parent_idea_id else None,
        )

    @staticmethod
    async def generate_ai_expansions(
        db: AsyncSession,
        room_id: UUID,
        step_id: UUID,
        topic: str,
        parent_ideas: list[Idea],
        round_num: int,
        agent_configs: list[dict],
        count_per_agent: int = 3,
        ai_gateway=None,
    ) -> dict:
        """
        AI基于选中观点进行接龙式拓展。

        TODO: 构建LeafHopper专用Prompt（通过IdeaGenerationService）
        TODO: 将parent_ideas的content传入Prompt
        TODO: 保存时记录round和parent_idea_id链路
        """
        parent_texts = [idea.content for idea in parent_ideas]

        results = await IdeaGenerationService.generate(
            topic=topic,
            agent_configs=agent_configs,
            count_per_agent=count_per_agent,
            parent_ideas=parent_texts,
            ai_gateway=ai_gateway,
        )

        saved = {}
        for model_id, ideas_text_list in results.items():
            for idea_text in ideas_text_list:
                # TODO: 随机或轮流关联到不同parent_idea
                parent_id = str(parent_ideas[0].id) if parent_ideas else None
                ideas = await IdeaExtractionService.extract_and_save(
                    db=db,
                    text=idea_text,
                    room_id=str(room_id),
                    step_id=str(step_id),
                    source_id=model_id,
                    source_name=model_id,
                    source_type="ai",
                    source_color="#6366f1",
                    round_num=round_num,
                    parent_idea_id=parent_id,
                )
                saved.setdefault(model_id, []).extend(ideas)

        return saved
