# ===========================================================
# FastFocus 快速聚焦服务
# ===========================================================

from uuid import UUID
from collections import Counter

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sqlfunc

from app.models.idea import Idea
from app.models.idea_vote import IdeaVote, VoteType
from app.services.thinklets.base import BaseThinkLetService
from app.services.shared.similarity import SimilarityService


class FastFocusService(BaseThinkLetService):
    """
    快速聚焦：逐条表决 Keep/Merge/Discard，快速收窄观点范围。
    
    流程：
    1. start_step() + carry_over_ideas() 从上一环节搬入观点
    2. AI检测相似项 → detect_similar_pairs()
    3. 每人逐条投票 → cast_vote()
    4. 汇总投票结果 → tally_votes()
    5. 自动处理（多数决）→ apply_results()
    6. end_step()
    """

    @staticmethod
    async def cast_vote(
        db: AsyncSession,
        idea_id: UUID,
        voter_id: UUID,
        vote_type: str,
        comment: str | None = None,
    ) -> IdeaVote:
        """
        用户对单条观点投票。

        TODO: 校验vote_type是否合法（keep/merge/discard）
        TODO: 校验用户是否重复投票（同一观点同一用户只能投一次）
        """
        vote = IdeaVote(
            idea_id=idea_id,
            voter_id=voter_id,
            vote_type=VoteType(vote_type),
            comment=comment,
        )
        db.add(vote)
        await db.flush()
        return vote

    @staticmethod
    async def tally_votes(
        db: AsyncSession,
        step_id: UUID,
    ) -> list[dict]:
        """
        汇总某环节所有观点的投票结果。

        返回: [{"idea_id", "content", "keep_count", "merge_count", "discard_count", "final_status"}, ...]

        TODO: 实现多数决逻辑
          - keep票最多 → kept
          - discard票最多 → discarded
          - merge票最多 → 标记待合并
        """
        ideas = await BaseThinkLetService.get_step_ideas(db, step_id)
        results = []

        for idea in ideas:
            # 查询该观点的投票统计
            votes_result = await db.execute(
                select(IdeaVote.vote_type, sqlfunc.count())
                .where(IdeaVote.idea_id == idea.id)
                .group_by(IdeaVote.vote_type)
            )
            vote_counts = dict(votes_result.all())

            keep = vote_counts.get(VoteType.KEEP, 0)
            merge = vote_counts.get(VoteType.MERGE, 0)
            discard = vote_counts.get(VoteType.DISCARD, 0)

            # 多数决
            max_vote = max(keep, merge, discard)
            if max_vote == 0:
                status = "kept"  # 无人投票默认保留
            elif keep >= merge and keep >= discard:
                status = "kept"
            elif discard >= merge:
                status = "discarded"
            else:
                status = "merged"

            results.append({
                "idea_id": str(idea.id),
                "content": idea.content,
                "keep_count": keep,
                "merge_count": merge,
                "discard_count": discard,
                "final_status": status,
            })

        return results

    @staticmethod
    async def apply_results(
        db: AsyncSession,
        step_id: UUID,
    ) -> list[Idea]:
        """
        根据投票结果更新观点状态。

        TODO: kept → is_selected=True
        TODO: discarded → is_selected=False
        TODO: merged → 调用SimilarityService.suggest_merge()合并后is_selected=True
        """
        tally = await FastFocusService.tally_votes(db, step_id)

        for item in tally:
            idea = await db.get(Idea, item["idea_id"])
            if idea:
                idea.is_selected = item["final_status"] != "discarded"

        await db.flush()
        return await BaseThinkLetService.get_selected_ideas(db, step_id)

    @staticmethod
    async def detect_similar_pairs(
        db: AsyncSession,
        step_id: UUID,
        ai_gateway=None,
    ) -> list[tuple[str, str, float]]:
        """
        AI检测相似观点对，辅助用户决策合并。

        TODO: 调用 SimilarityService.detect_duplicates()
        TODO: 通过WebSocket推送相似对建议到前端
        """
        ideas = await BaseThinkLetService.get_step_ideas(db, step_id)
        idea_dicts = [{"id": str(i.id), "content": i.content} for i in ideas]
        return await SimilarityService.detect_duplicates(idea_dicts, ai_gateway=ai_gateway)
