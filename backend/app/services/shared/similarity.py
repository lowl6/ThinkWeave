# ===========================================================
# 公共服务：相似度检测
# 被 FastFocus / PopcornSort 使用
# ===========================================================

from uuid import UUID


class SimilarityService:
    """
    检测观点间的语义相似度，用于去重和合并建议。
    FastFocus（合并建议）和 PopcornSort（去重）共用。
    """

    @staticmethod
    async def detect_duplicates(
        ideas: list[dict],
        threshold: float = 0.85,
        ai_gateway=None,
    ) -> list[tuple[str, str, float]]:
        """
        检测相似观点对。

        参数:
            ideas: [{"id": str, "content": str}]
            threshold: 相似度阈值（0-1）

        返回:
            [(idea_id_1, idea_id_2, similarity_score), ...]

        TODO: 实现方案1 — AI判断
          Prompt: "判断以下哪些观点含义高度相似（>85%相似度），
                   返回相似对的编号和相似度分数"
        
        TODO: 实现方案2 — Embedding余弦相似度
          1. 获取embedding向量
          2. 计算余弦相似度矩阵
          3. 过滤>threshold的对
        """
        return []

    @staticmethod
    async def suggest_merge(
        idea_a: str,
        idea_b: str,
        ai_gateway=None,
    ) -> str:
        """
        AI生成两条相似观点的合并文案。

        TODO: 实现合并Prompt
          "以下两条观点含义相似，请合并为一条更精炼的综合观点：
           A: {idea_a}
           B: {idea_b}"
        """
        # TODO: 调用AI合并
        return idea_a  # 暂时返回第一条

    @staticmethod
    async def batch_deduplicate(
        ideas: list[dict],
        threshold: float = 0.85,
        ai_gateway=None,
    ) -> list[dict]:
        """
        批量去重：返回去重后的观点列表 + 被移除的ID列表。

        TODO: 实现批量去重逻辑
          1. 检测所有相似对
          2. 对每对保留较长/较完整的一条
          3. 返回精简后的列表
        """
        return ideas
