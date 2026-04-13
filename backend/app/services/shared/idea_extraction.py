# ===========================================================
# 公共服务：观点精炼提取
# 被 FreeBrainstorm / LeafHopper / FastFocus / BucketWalk /
#    PopcornSort / StrawPoll 共同使用
# ===========================================================

import re
from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.idea import Idea


class IdeaExtractionService:
    """
    从AI/用户长文本中提取独立观点列表。
    所有ThinkLets在处理AI回复或用户输入时均调用此服务。
    """

    @staticmethod
    def extract_from_text(text: str) -> list[str]:
        """
        基于规则从文本中提取独立观点。
        
        策略：
        1. 按编号列表拆分（"1. xxx"、"1、xxx"、"(1) xxx"）
        2. 按Markdown列表拆分（"- xxx"、"* xxx"）
        3. 按段落拆分（双换行）
        4. 过滤太短的行（< 5字符）

        TODO: 后续可增加AI辅助提取（调用AI网关让模型精炼观点）
        """
        lines: list[str] = []

        # 尝试匹配编号列表
        numbered = re.split(r'\n\s*(?:\d+[.、)]\s*|[-*]\s+|\(\d+\)\s*)', text)
        if len(numbered) > 2:
            lines = numbered
        else:
            # 按段落拆分
            lines = text.split('\n')

        # 清洗
        results = []
        for line in lines:
            cleaned = re.sub(r'^[\d]+[.、)]\s*', '', line).strip()
            cleaned = re.sub(r'^[-*]\s+', '', cleaned).strip()
            if len(cleaned) >= 5:
                results.append(cleaned)

        return results

    @staticmethod
    async def extract_and_save(
        db: AsyncSession,
        text: str,
        room_id: str,
        step_id: str | None,
        source_id: str,
        source_name: str,
        source_type: str,
        source_color: str,
        round_num: int = 1,
        parent_idea_id: str | None = None,
    ) -> list[Idea]:
        """
        提取文本中的观点并批量保存到数据库。
        
        被所有ThinkLet环节调用：
        - FreeBrainstorm: 从AI多模型回复中提取观点
        - LeafHopper: 从接龙回复中提取，带round和parentId
        - FastFocus: 从用户澄清意见中提取
        - BucketWalk / PopcornSort: 从AI聚类建议中提取
        - StrawPoll: 从AI总结中提取

        TODO: 调用AI网关做更精准的观点提炼（将长句压缩为核心观点）
        """
        raw_ideas = IdeaExtractionService.extract_from_text(text)
        saved_ideas = []

        for content in raw_ideas:
            idea = Idea(
                room_id=room_id,
                step_id=step_id,
                content=content,
                source_id=source_id,
                source_name=source_name,
                source_type=source_type,
                source_color=source_color,
                round=round_num,
                parent_idea_id=parent_idea_id,
            )
            db.add(idea)
            saved_ideas.append(idea)

        await db.flush()
        return saved_ideas

    @staticmethod
    async def refine_with_ai(
        raw_ideas: list[str],
        ai_gateway,  # AIGateway instance
        model_id: str = "deepseek-v3",
    ) -> list[str]:
        """
        用AI精炼提取观点（将冗长文本压缩为核心要素）。

        TODO: 实现AI精炼Prompt
          - "请将以下观点列表精炼为简洁的核心观点，每条不超过30字：\n{ideas}"
          - 解析AI返回的精炼结果
        """
        # TODO: 对接AI网关
        return raw_ideas  # 暂时直接返回
