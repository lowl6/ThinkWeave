// ============================================================
// ThinkWeave 多Agent响应聚合器
// 负责聚合多个Agent的响应、去重、排序
// ============================================================

import type { Message } from '@/types/models';

export interface AggregatedResponse {
  messages: Message[];
  totalAgents: number;
  completedAgents: number;
  failedAgents: string[];
}

class ResponseAggregator {
  private pendingResponses: Map<string, Message> = new Map();
  private completedResponses: Map<string, Message> = new Map();
  private failedAgents: Set<string> = new Set();

  /**
   * 开始新一轮聚合
   * TODO: 在每次用户发送消息时调用，初始化聚合状态
   */
  startRound(agentIds: string[]): void {
    this.pendingResponses.clear();
    this.completedResponses.clear();
    this.failedAgents.clear();
    // 将所有目标Agent标记为pending
    agentIds.forEach((id) => {
      // placeholder message will be replaced
    });
  }

  /**
   * 标记某个Agent响应完成
   * TODO: 收到完整响应后调用，将消息从pending移到completed
   */
  markCompleted(agentId: string, message: Message): void {
    this.pendingResponses.delete(agentId);
    this.completedResponses.set(agentId, message);
  }

  /**
   * 标记某个Agent响应失败
   */
  markFailed(agentId: string): void {
    this.pendingResponses.delete(agentId);
    this.failedAgents.add(agentId);
  }

  /**
   * 获取当前聚合结果
   */
  getResult(): AggregatedResponse {
    return {
      messages: Array.from(this.completedResponses.values()),
      totalAgents:
        this.completedResponses.size +
        this.pendingResponses.size +
        this.failedAgents.size,
      completedAgents: this.completedResponses.size,
      failedAgents: Array.from(this.failedAgents),
    };
  }

  /**
   * 检查是否所有Agent都已完成（成功或失败）
   */
  isAllComplete(): boolean {
    return this.pendingResponses.size === 0;
  }

  /**
   * 去重：对多个Agent的响应进行语义去重
   * TODO: 调用后端的语义相似度API，移除高度相似的响应
   * TODO: 去重阈值可配置（如相似度>0.9视为重复）
   */
  async deduplicateResponses(
    messages: Message[]
  ): Promise<Message[]> {
    // TODO: 实现语义去重逻辑
    // 1. 两两计算响应内容的语义相似度
    // 2. 相似度超过阈值的保留得分更高/来源更权威的一条
    return messages;
  }

  /**
   * 排序：按相关性/评分/时间对响应排序
   * TODO: 实现多维度排序策略
   */
  sortResponses(
    messages: Message[],
    strategy: 'time' | 'score' | 'relevance' = 'time'
  ): Message[] {
    switch (strategy) {
      case 'time':
        return [...messages].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      case 'score':
        return [...messages].sort(
          (a, b) => (b.score ?? 0) - (a.score ?? 0)
        );
      case 'relevance':
        // TODO: 实现基于相关性的排序
        return messages;
      default:
        return messages;
    }
  }
}

export const responseAggregator = new ResponseAggregator();
