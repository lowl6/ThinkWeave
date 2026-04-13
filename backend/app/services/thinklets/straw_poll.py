# ===========================================================
# StrawPoll 麦秆投票服务
# ===========================================================

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sqlfunc

from app.models.idea import Idea
from app.models.poll_ballot import PollBallot
from app.models.workflow import WorkflowStep
from app.services.thinklets.base import BaseThinkLetService
from app.services.shared.summary import SummaryService


class StrawPollService(BaseThinkLetService):
    """
    麦秆投票：每人分配固定点数，对观点进行投票排序。
    
    流程：
    1. start_step() + carry_over_ideas() 搬入精选观点
    2. 获取每人可用点数 → get_points_budget()
    3. 用户分配点数投票 → cast_ballot()
    4. 实时更新排名 → get_live_rankings()
    5. 汇总最终结果 → get_final_results()
    6. AI生成排名报告 → generate_report()
    7. end_step()
    """

    @staticmethod
    async def get_points_budget(
        db: AsyncSession,
        step_id: UUID,
    ) -> int:
        """获取该环节每人可分配的总点数"""
        step = await db.get(WorkflowStep, step_id)
        return step.points_per_voter if step else 5

    @staticmethod
    async def get_remaining_points(
        db: AsyncSession,
        step_id: UUID,
        voter_id: UUID,
    ) -> int:
        """获取某用户剩余可分配点数"""
        budget = await StrawPollService.get_points_budget(db, step_id)
        result = await db.execute(
            select(sqlfunc.coalesce(sqlfunc.sum(PollBallot.points), 0))
            .where(PollBallot.step_id == step_id, PollBallot.voter_id == voter_id)
        )
        used = result.scalar()
        return budget - used

    @staticmethod
    async def cast_ballot(
        db: AsyncSession,
        step_id: UUID,
        idea_id: UUID,
        voter_id: UUID,
        points: int,
    ) -> PollBallot:
        """
        对某条观点投票（分配点数）。

        TODO: 校验剩余点数是否足够
        TODO: 如果已经投过该观点则累加（或替换）
        TODO: 通过WebSocket实时推送排名更新
        """
        remaining = await StrawPollService.get_remaining_points(db, step_id, voter_id)
        if points > remaining:
            raise ValueError(f"点数不足：剩余 {remaining}，需要 {points}")

        ballot = PollBallot(
            idea_id=idea_id,
            voter_id=voter_id,
            step_id=step_id,
            points=points,
        )
        db.add(ballot)
        await db.flush()
        return ballot

    @staticmethod
    async def batch_cast(
        db: AsyncSession,
        step_id: UUID,
        voter_id: UUID,
        ballots: list[dict],
    ) -> list[PollBallot]:
        """
        批量提交投票（一次性提交所有分配）。

        TODO: 校验总点数不超过budget
        TODO: 清除该用户之前的投票（替换模式）
        """
        # 清除旧投票
        old_result = await db.execute(
            select(PollBallot)
            .where(PollBallot.step_id == step_id, PollBallot.voter_id == voter_id)
        )
        for old in old_result.scalars().all():
            await db.delete(old)

        # 校验总点数
        budget = await StrawPollService.get_points_budget(db, step_id)
        total = sum(b["points"] for b in ballots)
        if total > budget:
            raise ValueError(f"总点数 {total} 超过预算 {budget}")

        saved = []
        for b in ballots:
            ballot = PollBallot(
                idea_id=b["idea_id"],
                voter_id=voter_id,
                step_id=step_id,
                points=b["points"],
            )
            db.add(ballot)
            saved.append(ballot)

        await db.flush()
        return saved

    @staticmethod
    async def get_live_rankings(
        db: AsyncSession,
        step_id: UUID,
    ) -> list[dict]:
        """
        获取实时投票排名。

        返回: [{"idea_id", "content", "total_points", "voter_count", "rank"}, ...]
        """
        ideas = await BaseThinkLetService.get_step_ideas(db, step_id)
        rankings = []

        for idea in ideas:
            result = await db.execute(
                select(
                    sqlfunc.coalesce(sqlfunc.sum(PollBallot.points), 0),
                    sqlfunc.count(sqlfunc.distinct(PollBallot.voter_id)),
                )
                .where(PollBallot.idea_id == idea.id)
            )
            row = result.one()
            rankings.append({
                "idea_id": str(idea.id),
                "content": idea.content,
                "total_points": row[0],
                "voter_count": row[1],
            })

        # 排序
        rankings.sort(key=lambda x: x["total_points"], reverse=True)
        for i, item in enumerate(rankings):
            item["rank"] = i + 1

        return rankings

    @staticmethod
    async def get_final_results(
        db: AsyncSession,
        step_id: UUID,
    ) -> list[dict]:
        """获取最终排名结果（同get_live_rankings，但标记selected）"""
        rankings = await StrawPollService.get_live_rankings(db, step_id)

        # 标记排名前N的为selected
        for item in rankings:
            idea = await db.get(Idea, item["idea_id"])
            if idea:
                idea.is_selected = item["rank"] <= 5  # 默认保留前5

        await db.flush()
        return rankings

    @staticmethod
    async def generate_report(
        step_id: UUID,
        rankings: list[dict],
        ai_gateway=None,
    ) -> str:
        """
        AI生成投票分析报告。

        TODO: 调用 SummaryService.summarize_step("StrawPoll", ...)
        """
        return await SummaryService.summarize_step(
            step_type="StrawPoll",
            ideas=[{"content": r["content"], "points": r["total_points"]} for r in rankings],
            extra_data={"rankings": rankings},
            ai_gateway=ai_gateway,
        )
