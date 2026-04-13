# ===========================================================
# 公共服务：结果汇总
# 被 StrawPoll（排名报告）和全流程报告使用
# ===========================================================


class SummaryService:
    """
    生成环节结果摘要和全流程汇总报告。
    """

    @staticmethod
    async def summarize_step(
        step_type: str,
        ideas: list[dict],
        extra_data: dict | None = None,
        ai_gateway=None,
    ) -> str:
        """
        为单个ThinkLet环节生成摘要。

        参数:
            step_type: ThinkLet类型
            ideas: 该环节产出的观点列表
            extra_data: 额外数据（投票结果、分桶结果等）

        TODO: 各环节摘要Prompt:
          - FreeBrainstorm: "以下是头脑风暴产出的{N}条观点，请总结为3-5个关键方向..."
          - LeafHopper: "以下是{R}轮接龙发散的结果，请分析创新路径和关键洞察..."
          - FastFocus: "以下是快速聚焦后保留的{N}条核心观点，请归纳主题..."
          - BucketWalk: "以下是按{M}个分类桶整理的观点，请总结每桶要点..."
          - PopcornSort: "以下是筛选后的精选观点，请总结关键发现..."
          - StrawPoll: "以下是投票排名结果：{排名}，请分析共识和分歧..."
        """
        # TODO: 实现AI汇总
        return f"[摘要待生成] 共{len(ideas)}条观点"

    @staticmethod
    async def generate_final_report(
        topic: str,
        step_summaries: list[dict],
        ai_gateway=None,
    ) -> str:
        """
        生成完整的研讨报告。

        参数:
            topic: 研讨主题
            step_summaries: [{"step_type": str, "title": str, "summary": str}, ...]

        TODO: 实现报告生成Prompt
          "你是一个研讨报告编写专家。以下是关于「{topic}」的研讨过程：
           [每个环节的摘要]
           请生成一份结构化的研讨报告，包含：背景、方法、关键发现、建议方案、结论。"
        """
        # TODO: 实现AI报告生成
        return f"# {topic} 研讨报告\n\n[待生成]"
