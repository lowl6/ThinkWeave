# ===========================================================
# FreeBrainstorm 自由头脑风暴服务
# ===========================================================

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.thinklets.base import BaseThinkLetService
from app.services.shared.idea_extraction import IdeaExtractionService
from app.services.shared.idea_generation import IdeaGenerationService


class FreeBrainstormService(BaseThinkLetService):
    """
    自由头脑风暴：所有参与者（人+AI）自由产出想法。
    
    流程：
    1. start_step() 开始环节
    2. 用户通过聊天输入观点 → add_user_idea()
    3. AI并行生成观点 → generate_ai_ideas()
    4. 所有观点通过 IdeaExtractionService 提取并存入灵感池
    5. end_step() 结束环节
    """

    @staticmethod
    async def add_user_idea(
        db: AsyncSession,
        room_id: UUID,
        step_id: UUID,
        user_id: str,
        user_name: str,
        content: str,
    ) -> list:
        """
        用户手动添加观点到灵感池。

        TODO: 对接前端的"手动添加便签"按钮
        TODO: 如果content是长文本，用IdeaExtractionService拆分为多条
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
        )

    @staticmethod
    async def generate_ai_ideas(
        db: AsyncSession,
        room_id: UUID,
        step_id: UUID,
        topic: str,
        agent_configs: list[dict],
        count_per_agent: int = 3,
        context: str = "",
        ai_gateway=None,
    ) -> dict:
        """
        多AI并行生成观点。

        TODO: 调用 IdeaGenerationService.generate() 并行生成
        TODO: 对每个Agent的结果调用 IdeaExtractionService.extract_and_save() 存库
        TODO: 通过WebSocket实时推送新观点到前端灵感池
        """
        results = await IdeaGenerationService.generate(
            topic=topic,
            agent_configs=agent_configs,
            count_per_agent=count_per_agent,
            context=context,
            ai_gateway=ai_gateway,
        )

        saved = {}
        for model_id, ideas_text_list in results.items():
            for idea_text in ideas_text_list:
                ideas = await IdeaExtractionService.extract_and_save(
                    db=db,
                    text=idea_text,
                    room_id=str(room_id),
                    step_id=str(step_id),
                    source_id=model_id,
                    source_name=model_id,
                    source_type="ai",
                    source_color="#6366f1",
                )
                saved.setdefault(model_id, []).extend(ideas)

        return saved
