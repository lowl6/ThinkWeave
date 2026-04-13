# ===========================================================
# ThinkLet 环节操作路由 — 6种ThinkLet的统一API
# ===========================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.idea import IdeaCreate, IdeaOut, IdeaUpdate, ClusterOut, BucketOut, PollResultOut
from app.schemas.thinklet import (
    FastFocusVoteRequest, FastFocusResult,
    BucketCreate, BucketAssignRequest, BucketAutoClassifyRequest,
    PopcornSortSelectRequest, PopcornSortClusterRequest, PopcornSortMergeRequest,
    StrawPollBallotRequest, StrawPollBatchBallot,
    LeafHopperContribution, LeafHopperAIExpandRequest,
)
from app.services.thinklets import (
    BaseThinkLetService,
    FreeBrainstormService,
    LeafHopperService,
    FastFocusService,
    BucketWalkService,
    PopcornSortService,
    StrawPollService,
)

router = APIRouter(prefix="/thinklets", tags=["ThinkLets环节"])


# ============ 公共：环节生命周期 ============

@router.post("/steps/{step_id}/start")
async def start_step(
    step_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """激活环节 — 所有ThinkLet通用"""
    # TODO: 权限校验（仅HOST可启动环节）
    step = await BaseThinkLetService.start_step(db, step_id)
    return {"status": "active", "step_id": str(step.id)}


@router.post("/steps/{step_id}/end")
async def end_step(
    step_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """结束环节 — 所有ThinkLet通用"""
    step = await BaseThinkLetService.end_step(db, step_id)
    return {"status": "completed", "step_id": str(step.id)}


@router.post("/steps/{from_step_id}/carry-over/{to_step_id}")
async def carry_over_ideas(
    from_step_id: str,
    to_step_id: str,
    room_id: str,
    only_selected: bool = True,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """将上一环节的观点搬运到下一环节 — 所有ThinkLet通用"""
    ideas = await BaseThinkLetService.carry_over_ideas(
        db, from_step_id, to_step_id, room_id, only_selected
    )
    return {"carried": len(ideas)}


@router.get("/steps/{step_id}/ideas", response_model=list[IdeaOut])
async def get_step_ideas(
    step_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """获取某环节所有观点 — 所有ThinkLet通用"""
    ideas = await BaseThinkLetService.get_step_ideas(db, step_id)
    return [IdeaOut.model_validate(i) for i in ideas]


# ============ FreeBrainstorm ============

@router.post("/brainstorm/{step_id}/ideas", response_model=list[IdeaOut])
async def brainstorm_add_idea(
    step_id: str,
    data: IdeaCreate,
    room_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """FreeBrainstorm: 手动添加观点"""
    ideas = await FreeBrainstormService.add_user_idea(
        db, room_id, step_id, str(user.id), user.display_name, data.content
    )
    return [IdeaOut.model_validate(i) for i in ideas]


@router.post("/brainstorm/{step_id}/generate")
async def brainstorm_ai_generate(
    step_id: str,
    room_id: str,
    topic: str,
    count: int = 3,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """FreeBrainstorm: AI多模型并行生成观点"""
    # TODO: 从room获取agent_configs
    result = await FreeBrainstormService.generate_ai_ideas(
        db, room_id, step_id, topic, [], count
    )
    return {"agents": {k: len(v) for k, v in result.items()}}


# ============ LeafHopper ============

@router.post("/leafhopper/{step_id}/contribute", response_model=list[IdeaOut])
async def leafhopper_contribute(
    step_id: str,
    data: LeafHopperContribution,
    room_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """LeafHopper: 用户基于观点发散新想法"""
    ideas = await LeafHopperService.add_user_contribution(
        db, room_id, step_id, str(user.id), user.display_name,
        data.content, data.round, data.parent_idea_id,
    )
    return [IdeaOut.model_validate(i) for i in ideas]


@router.get("/leafhopper/{step_id}/round/{round_num}", response_model=list[IdeaOut])
async def leafhopper_get_round(
    step_id: str,
    round_num: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """LeafHopper: 获取指定轮次的观点"""
    ideas = await LeafHopperService.get_round_ideas(db, step_id, round_num)
    return [IdeaOut.model_validate(i) for i in ideas]


# ============ FastFocus ============

@router.post("/fastfocus/{step_id}/vote")
async def fastfocus_vote(
    step_id: str,
    data: FastFocusVoteRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """FastFocus: 对观点投票 (keep/merge/discard)"""
    vote = await FastFocusService.cast_vote(
        db, data.idea_id, user.id, data.vote_type, data.comment
    )
    return {"vote_id": str(vote.id)}


@router.get("/fastfocus/{step_id}/tally", response_model=list[FastFocusResult])
async def fastfocus_tally(
    step_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """FastFocus: 获取投票汇总"""
    return await FastFocusService.tally_votes(db, step_id)


@router.post("/fastfocus/{step_id}/apply")
async def fastfocus_apply(
    step_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """FastFocus: 应用投票结果"""
    ideas = await FastFocusService.apply_results(db, step_id)
    return {"kept_count": len(ideas)}


# ============ BucketWalk ============

@router.post("/bucketwalk/{step_id}/buckets", response_model=BucketOut)
async def bucketwalk_create_bucket(
    step_id: str,
    data: BucketCreate,
    room_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """BucketWalk: 创建分类桶"""
    bucket = await BucketWalkService.create_bucket(
        db, room_id, step_id, data.label, data.description, data.color
    )
    return BucketOut.model_validate(bucket)


@router.post("/bucketwalk/assign")
async def bucketwalk_assign(
    data: BucketAssignRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """BucketWalk: 将观点分配到桶"""
    assignment = await BucketWalkService.assign_to_bucket(
        db, data.idea_id, data.bucket_id, user.id
    )
    return {"assignment_id": str(assignment.id)}


@router.post("/bucketwalk/{step_id}/auto-classify")
async def bucketwalk_auto_classify(
    step_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """BucketWalk: AI自动归类"""
    suggestions = await BucketWalkService.auto_classify(db, step_id)
    return {"suggestions": suggestions}


@router.get("/bucketwalk/{step_id}/results")
async def bucketwalk_results(
    step_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """BucketWalk: 获取分桶结果"""
    return await BucketWalkService.get_bucket_results(db, step_id)


# ============ PopcornSort ============

@router.post("/popcornsort/select")
async def popcornsort_select(
    data: PopcornSortSelectRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """PopcornSort: 批量选中/取消选中"""
    count = await PopcornSortService.batch_toggle(db, data.idea_ids, data.is_selected)
    return {"updated": count}


@router.post("/popcornsort/{step_id}/cluster", response_model=list[ClusterOut])
async def popcornsort_cluster(
    step_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """PopcornSort: AI语义聚类"""
    clusters = await PopcornSortService.trigger_cluster(db, step_id)
    return clusters


@router.post("/popcornsort/{step_id}/deduplicate")
async def popcornsort_deduplicate(
    step_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """PopcornSort: 去除重复观点"""
    removed = await PopcornSortService.remove_duplicates(db, step_id)
    return {"removed_ids": removed}


@router.post("/popcornsort/{step_id}/merge")
async def popcornsort_merge(
    step_id: str,
    data: PopcornSortMergeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """PopcornSort: 合并相似观点"""
    idea = await PopcornSortService.merge_similar(
        db, step_id, data.cluster_id, data.merged_content
    )
    return IdeaOut.model_validate(idea)


# ============ StrawPoll ============

@router.post("/strawpoll/{step_id}/ballot")
async def strawpoll_ballot(
    step_id: str,
    data: StrawPollBallotRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """StrawPoll: 单条投票"""
    ballot = await StrawPollService.cast_ballot(
        db, step_id, data.idea_id, user.id, data.points
    )
    return {"ballot_id": str(ballot.id)}


@router.post("/strawpoll/{step_id}/batch")
async def strawpoll_batch(
    step_id: str,
    data: StrawPollBatchBallot,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """StrawPoll: 批量提交投票"""
    ballots_data = [{"idea_id": b.idea_id, "points": b.points} for b in data.ballots]
    ballots = await StrawPollService.batch_cast(db, step_id, user.id, ballots_data)
    return {"ballots": len(ballots)}


@router.get("/strawpoll/{step_id}/rankings", response_model=list[PollResultOut])
async def strawpoll_rankings(
    step_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """StrawPoll: 获取实时排名"""
    return await StrawPollService.get_live_rankings(db, step_id)


@router.get("/strawpoll/{step_id}/remaining-points")
async def strawpoll_remaining(
    step_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """StrawPoll: 获取剩余可分配点数"""
    remaining = await StrawPollService.get_remaining_points(db, step_id, user.id)
    return {"remaining_points": remaining}
