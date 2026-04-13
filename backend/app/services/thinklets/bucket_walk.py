# ===========================================================
# BucketWalk 桶分类服务
# ===========================================================

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.idea import Idea
from app.models.bucket import Bucket
from app.models.bucket_assignment import BucketAssignment
from app.services.thinklets.base import BaseThinkLetService
from app.services.shared.semantic_cluster import SemanticClusterService


class BucketWalkService(BaseThinkLetService):
    """
    桶分类：预设分类桶，参与者将观点拖入对应桶中。
    
    流程：
    1. start_step() + carry_over_ideas() 搬入观点
    2. 创建桶 → create_buckets()（手动或AI建议）
    3. 逐条归类 → assign_to_bucket()
    4. AI辅助自动归类 → auto_classify()
    5. end_step()
    """

    @staticmethod
    async def create_bucket(
        db: AsyncSession,
        room_id: UUID,
        step_id: UUID,
        label: str,
        description: str = "",
        color: str = "#8b5cf6",
        order: int = 0,
    ) -> Bucket:
        """
        创建一个分类桶。

        TODO: 对接前端桶创建UI
        """
        bucket = Bucket(
            room_id=room_id,
            step_id=step_id,
            label=label,
            description=description,
            color=color,
            order=order,
        )
        db.add(bucket)
        await db.flush()
        return bucket

    @staticmethod
    async def create_buckets_batch(
        db: AsyncSession,
        room_id: UUID,
        step_id: UUID,
        buckets_data: list[dict],
    ) -> list[Bucket]:
        """批量创建桶"""
        buckets = []
        for i, data in enumerate(buckets_data):
            bucket = Bucket(
                room_id=room_id,
                step_id=step_id,
                label=data["label"],
                description=data.get("description", ""),
                color=data.get("color", "#8b5cf6"),
                order=i,
            )
            db.add(bucket)
            buckets.append(bucket)
        await db.flush()
        return buckets

    @staticmethod
    async def assign_to_bucket(
        db: AsyncSession,
        idea_id: UUID,
        bucket_id: UUID,
        user_id: UUID,
    ) -> BucketAssignment:
        """
        将观点分配到桶中。

        TODO: 校验idea和bucket属于同一房间/步骤
        TODO: 如果已分配过则更新而不是重复创建
        """
        # 删除该观点之前的分配
        existing = await db.execute(
            select(BucketAssignment).where(BucketAssignment.idea_id == idea_id)
        )
        for old in existing.scalars().all():
            await db.delete(old)

        assignment = BucketAssignment(
            idea_id=idea_id,
            bucket_id=bucket_id,
            assigned_by=user_id,
        )
        db.add(assignment)
        await db.flush()
        return assignment

    @staticmethod
    async def auto_classify(
        db: AsyncSession,
        step_id: UUID,
        ai_gateway=None,
    ) -> dict[str, str]:
        """
        AI自动归类：将未分类的观点自动分配到最匹配的桶。

        TODO: 调用 SemanticClusterService.suggest_bucket_assignment()
        TODO: 对每条建议调用 assign_to_bucket()
        TODO: 通过WebSocket推送归类结果到前端
        """
        ideas = await BaseThinkLetService.get_step_ideas(db, step_id)
        buckets_result = await db.execute(
            select(Bucket).where(Bucket.step_id == step_id).order_by(Bucket.order)
        )
        buckets = list(buckets_result.scalars().all())

        idea_dicts = [{"id": str(i.id), "content": i.content} for i in ideas]
        bucket_dicts = [{"id": str(b.id), "label": b.label, "description": b.description} for b in buckets]

        suggestions = await SemanticClusterService.suggest_bucket_assignment(
            idea_dicts, bucket_dicts, ai_gateway=ai_gateway
        )

        # TODO: 应用建议
        return suggestions

    @staticmethod
    async def get_bucket_results(
        db: AsyncSession,
        step_id: UUID,
    ) -> list[dict]:
        """
        获取分桶结果：每个桶及其包含的观点列表。
        """
        buckets_result = await db.execute(
            select(Bucket).where(Bucket.step_id == step_id).order_by(Bucket.order)
        )
        buckets = list(buckets_result.scalars().all())

        results = []
        for bucket in buckets:
            assignment_result = await db.execute(
                select(BucketAssignment.idea_id)
                .where(BucketAssignment.bucket_id == bucket.id)
            )
            idea_ids = [str(row[0]) for row in assignment_result.all()]
            results.append({
                "id": str(bucket.id),
                "label": bucket.label,
                "description": bucket.description,
                "color": bucket.color,
                "order": bucket.order,
                "idea_ids": idea_ids,
            })

        return results
