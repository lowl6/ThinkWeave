# ===========================================================
# 公共服务：语义聚类
# 被 PopcornSort / BucketWalk 使用
# ===========================================================

from uuid import UUID


class SemanticClusterService:
    """
    对观点列表进行语义聚类分组。
    PopcornSort（自动聚类展示）和 BucketWalk（AI建议归类）共用。
    """

    @staticmethod
    async def cluster(
        ideas: list[dict],
        num_clusters: int | None = None,
        ai_gateway=None,
    ) -> list[dict]:
        """
        对观点进行语义聚类。

        参数:
            ideas: [{"id": uuid, "content": str}, ...]
            num_clusters: 指定聚类数（为None则自动判断）
            ai_gateway: AI调用网关实例

        返回:
            [{"cluster_id": str, "label": str, "idea_ids": [uuid, ...]}, ...]

        TODO: 实现方案1 — 基于AI的聚类
          Prompt: "将以下观点按语义相似度分组，给每组一个简短标签：
                   {ideas列表}
                   以JSON格式返回: [{group_label, idea_indices}]"

        TODO: 实现方案2 — 基于Embedding的聚类
          1. 调用embedding API获取每条观点的向量
          2. 使用DBSCAN或K-Means聚类
          3. AI为每个聚类生成标签

        TODO: 两种方案可配置切换
        """
        # TODO: 实现聚类逻辑
        return []

    @staticmethod
    async def suggest_bucket_assignment(
        ideas: list[dict],
        buckets: list[dict],
        ai_gateway=None,
    ) -> dict[str, str]:
        """
        BucketWalk专用：AI建议观点归入哪个桶。

        参数:
            ideas: [{"id": uuid, "content": str}]
            buckets: [{"id": uuid, "label": str, "description": str}]

        返回:
            {idea_id: bucket_id}

        TODO: 实现AI分类建议
          Prompt: "以下是预定义的分类桶：{buckets}
                   请将每条观点分配到最合适的桶中：{ideas}
                   以JSON格式返回：{idea_id: bucket_id}"
        """
        return {}
