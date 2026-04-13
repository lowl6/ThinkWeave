# ===========================================================
# PopcornSort 米花拾掇服务
# ===========================================================

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.idea import Idea
from app.services.thinklets.base import BaseThinkLetService
from app.services.shared.semantic_cluster import SemanticClusterService
from app.services.shared.similarity import SimilarityService
from app.services.shared.idea_extraction import IdeaExtractionService


class PopcornSortService(BaseThinkLetService):
    """
    米花拾掇：逐条筛选 + AI语义聚类 + 去重合并。
    
    流程：
    1. start_step() + carry_over_ideas() 搬入观点
    2. 展示全部观点卡片
    3. 用户点击选中保留 → toggle_selection()
    4. AI语义聚类 → trigger_cluster()
    5. 去重 → remove_duplicates()
    6. 合并相似项 → merge_similar()
    7. end_step()（只保留selected的观点）
    """

    @staticmethod
    async def toggle_selection(
        db: AsyncSession,
        idea_id: UUID,
        is_selected: bool,
    ) -> Idea:
        """切换观点选中状态"""
        idea = await db.get(Idea, idea_id)
        if not idea:
            raise ValueError(f"Idea {idea_id} not found")
        idea.is_selected = is_selected
        await db.flush()
        return idea

    @staticmethod
    async def batch_toggle(
        db: AsyncSession,
        idea_ids: list[UUID],
        is_selected: bool,
    ) -> int:
        """批量切换选中状态"""
        result = await db.execute(
            update(Idea)
            .where(Idea.id.in_(idea_ids))
            .values(is_selected=is_selected)
        )
        await db.flush()
        return result.rowcount

    @staticmethod
    async def trigger_cluster(
        db: AsyncSession,
        step_id: UUID,
        ai_gateway=None,
    ) -> list[dict]:
        """
        触发AI语义聚类。

        TODO: 调用 SemanticClusterService.cluster()
        TODO: 更新每条Idea的cluster_id
        TODO: 通过WebSocket推送聚类结果到前端
        """
        ideas = await BaseThinkLetService.get_step_ideas(db, step_id)
        idea_dicts = [{"id": str(i.id), "content": i.content} for i in ideas]

        clusters = await SemanticClusterService.cluster(idea_dicts, ai_gateway=ai_gateway)

        # 更新cluster_id
        for cluster in clusters:
            for idea_id in cluster.get("idea_ids", []):
                idea = await db.get(Idea, idea_id)
                if idea:
                    idea.cluster_id = cluster["cluster_id"]

        await db.flush()
        return clusters

    @staticmethod
    async def remove_duplicates(
        db: AsyncSession,
        step_id: UUID,
        ai_gateway=None,
    ) -> list[str]:
        """
        去除重复观点。

        TODO: 调用 SimilarityService.detect_duplicates()
        TODO: 对每对重复项保留较完整的一条，删除另一条
        TODO: 返回被删除的idea_id列表
        """
        ideas = await BaseThinkLetService.get_step_ideas(db, step_id)
        idea_dicts = [{"id": str(i.id), "content": i.content} for i in ideas]

        duplicates = await SimilarityService.detect_duplicates(idea_dicts, ai_gateway=ai_gateway)

        removed_ids = []
        for id_a, id_b, score in duplicates:
            # 保留较长的一条，删除较短的
            idea_a = next((i for i in ideas if str(i.id) == id_a), None)
            idea_b = next((i for i in ideas if str(i.id) == id_b), None)
            if idea_a and idea_b:
                to_remove = idea_b if len(idea_a.content) >= len(idea_b.content) else idea_a
                to_remove.is_selected = False
                removed_ids.append(str(to_remove.id))

        await db.flush()
        return removed_ids

    @staticmethod
    async def merge_similar(
        db: AsyncSession,
        step_id: UUID,
        cluster_id: str,
        merged_content: str | None = None,
        ai_gateway=None,
    ) -> Idea:
        """
        合并同一聚类内的观点为一条综合观点。

        TODO: 如果merged_content为空，调用SimilarityService.suggest_merge()让AI生成
        TODO: 将该cluster内的其他观点标记为未选中
        TODO: 创建新的合并后观点
        """
        # 获取该cluster的观点
        result = await db.execute(
            select(Idea)
            .where(Idea.step_id == step_id, Idea.cluster_id == cluster_id)
            .order_by(Idea.created_at)
        )
        cluster_ideas = list(result.scalars().all())

        if not cluster_ideas:
            raise ValueError(f"No ideas in cluster {cluster_id}")

        # 生成合并内容
        if not merged_content and ai_gateway:
            texts = [i.content for i in cluster_ideas]
            merged_content = await SimilarityService.suggest_merge(
                texts[0], texts[1] if len(texts) > 1 else texts[0],
                ai_gateway=ai_gateway,
            )

        if not merged_content:
            merged_content = cluster_ideas[0].content

        # 标记原观点为未选中
        for idea in cluster_ideas:
            idea.is_selected = False

        # 创建合并后的新观点
        merged_idea = Idea(
            room_id=cluster_ideas[0].room_id,
            step_id=step_id,
            content=merged_content,
            source_id="system",
            source_name="AI合并",
            source_type="ai",
            source_color="#f97316",
            is_selected=True,
            cluster_id=cluster_id,
        )
        db.add(merged_idea)
        await db.flush()
        return merged_idea
