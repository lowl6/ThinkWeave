// ============================================================
// ThinkWeave Agent能力插件 — 观点提取
// 从AI对话内容中自动提取独立观点
// ============================================================

import type { Idea } from '@/types/models';
import { agentRegistry } from '../AgentRegistry';

export class IdeaExtractionPlugin {
  /**
   * 从AI消息内容中提取独立观点
   *
   * TODO: 实现基于规则的初步提取（按编号/分段/bullet points拆分）
   * TODO: 实现基于AI的深度提取（调用Agent API让AI总结提炼核心观点）
   * TODO: 为每条观点标记来源Agent信息（名称、颜色）
   * TODO: 去除重复观点（与灵感池已有观点对比）
   */
  static extract(
    agentId: string,
    messageContent: string
  ): Idea[] {
    const model = agentRegistry.getModel(agentId);
    const ideas: Idea[] = [];

    // TODO: 实现提取算法
    // 策略1: 按换行+编号拆分（"1. xxx\n2. xxx"）
    // 策略2: 按bullet拆分（"- xxx\n- xxx"）
    // 策略3: 调用AI API提取关键观点

    // 临时实现：按换行拆分非空行
    const lines = messageContent
      .split('\n')
      .map((l) => l.replace(/^[\d]+[.、)]\s*/, '').trim())
      .filter((l) => l.length > 5);

    lines.forEach((line) => {
      ideas.push({
        id: crypto.randomUUID(),
        content: line,
        source: model?.name ?? agentId,
        sourceColor: model?.statusColor ?? '#6b7280',
        createdAt: new Date().toISOString(),
        isSelected: false,
      });
    });

    return ideas;
  }
}
