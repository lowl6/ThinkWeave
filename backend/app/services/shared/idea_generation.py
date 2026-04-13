# ===========================================================
# 公共服务：AI观点生成
# 被 FreeBrainstorm / LeafHopper 使用
# ===========================================================


class IdeaGenerationService:
    """
    调用多个AI模型并行生成观点。
    FreeBrainstorm 和 LeafHopper 发散阶段共用。
    """

    @staticmethod
    async def generate(
        topic: str,
        agent_configs: list[dict],
        count_per_agent: int = 3,
        context: str = "",
        parent_ideas: list[str] | None = None,
        ai_gateway=None,
    ) -> dict[str, list[str]]:
        """
        并行调用多个AI模型生成观点。

        参数:
            topic: 研讨主题
            agent_configs: Agent配置列表 [{model_id, system_prompt, temperature, max_tokens}]
            count_per_agent: 每个Agent生成的观点数
            context: 额外的上下文信息（如历史讨论）
            parent_ideas: LeafHopper模式下的父观点列表（基于这些拓展）
            ai_gateway: AI调用网关实例

        返回:
            {agent_id: [idea1, idea2, ...]}

        TODO: 实现并行调用逻辑
          1. 为每个Agent构建Prompt:
             - FreeBrainstorm: "围绕{topic}，请提出{count}条独特的观点/想法..."
             - LeafHopper: "基于以下已有观点：{parents}，请向新方向跳跃发散{count}条新想法..."
          2. 使用 asyncio.gather 并行调用
          3. 用 IdeaExtractionService.extract_from_text() 解析AI返回
          4. 错误Agent不影响其他Agent
        """
        results: dict[str, list[str]] = {}

        # TODO: 实现AI并行生成
        for config in agent_configs:
            model_id = config.get("model_id", "unknown")
            # TODO: 构建prompt并调用ai_gateway
            results[model_id] = []

        return results

    @staticmethod
    def build_brainstorm_prompt(topic: str, count: int, context: str = "") -> str:
        """构建自由头脑风暴的Prompt"""
        prompt = f"请围绕「{topic}」这一主题，产生 {count} 条独特、有创意的观点或想法。"
        if context:
            prompt += f"\n\n参考背景：{context}"
        prompt += "\n\n请以编号列表形式输出，每条观点简洁明确（1-2句话）。"
        return prompt

    @staticmethod
    def build_leafhopper_prompt(
        topic: str,
        parent_ideas: list[str],
        count: int,
        round_num: int,
    ) -> str:
        """构建接龙发散的Prompt"""
        parents_text = "\n".join(f"- {idea}" for idea in parent_ideas)
        return (
            f"研讨主题：{topic}\n\n"
            f"这是第 {round_num} 轮接龙发散。基于以下已有观点：\n{parents_text}\n\n"
            f"请从不同角度、跨领域地跳跃式发散出 {count} 条全新的想法。"
            f"要求：不要重复已有观点，尽量从全新方向切入。\n"
            f"请以编号列表形式输出。"
        )
