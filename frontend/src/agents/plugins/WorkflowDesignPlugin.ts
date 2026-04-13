// ============================================================
// ThinkWeave Agent能力插件 — AI智能流程设计
// 根据研讨主题自动生成ThinkLets流程
// ============================================================

import type { ThinkLetStep } from '@/types/models';

export class WorkflowDesignPlugin {
  /**
   * AI智能设计研讨流程
   *
   * TODO: 调用AI Agent，传入研讨主题，生成定制化ThinkLets流程
   *
   * Prompt策略：
   *   "你是一个研讨流程设计专家。用户的研讨主题是：{topic}
   *    请基于 ThinkLets 方法论，设计一个包含3-6个环节的研讨流程。
   *    可用环节类型：FreeBrainstorm(发散), PopcornSort(筛选), StrawPoll(投票), SixHats(六帽), SWOT(矩阵), Summary(总结)
   *    请为每个环节输出：type, title, durationMinutes, prompt
   *    以JSON数组格式返回。"
   *
   * TODO: 解析AI返回的JSON，校验格式合法性
   * TODO: 添加容错处理（AI返回格式异常时使用默认模板）
   * TODO: 在调用期间显示"AI 思考中..."加载动画
   */
  static async designWorkflow(topic: string): Promise<ThinkLetStep[]> {
    if (!topic.trim()) {
      throw new Error('请输入研讨主题，AI 将根据主题设计流程。');
    }

    // TODO: 实现AI调用
    // 1. 构建prompt
    // 2. 调用 agentApi.chat() (使用默认Agent)
    // 3. 解析JSON响应
    // 4. 校验每个step的type是否合法
    // 5. 生成id和order

    throw new Error('WorkflowDesignPlugin.designWorkflow not implemented');
  }
}
