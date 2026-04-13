// ============================================================
// ThinkWeave Agent并行调度器
// 将用户请求并行分发到多个选中的Agent，收集响应
// ============================================================

import type { AgentConfig } from '@/types/models';
import { agentRegistry } from './AgentRegistry';
import { AgentStreamHandler } from './AgentStreamHandler';

export interface DispatchRequest {
  roomId: string;
  content: string;
  targetAgentIds: string[];
  chatHistory: { role: 'user' | 'assistant' | 'system'; content: string }[];
}

export interface DispatchResult {
  agentId: string;
  success: boolean;
  error?: string;
}

class AgentDispatcher {
  private streamHandler: AgentStreamHandler;

  constructor() {
    this.streamHandler = new AgentStreamHandler();
  }

  /**
   * 并行分发请求到多个Agent
   *
   * TODO: 实现并行API调用逻辑
   *   1. 遍历 targetAgentIds，为每个Agent构建请求
   *   2. 从 agentStore 获取每个Agent的配置（systemPrompt/temperature/maxTokens）
   *   3. 使用 Promise.allSettled 并行发送请求
   *   4. 对于流式响应，通过 AgentStreamHandler 处理SSE流
   *   5. 对于非流式响应，直接返回完整内容
   *   6. 错误Agent不影响其他Agent的响应
   *
   * TODO: 实现请求超时机制（单个Agent超时30s，不阻塞其他Agent）
   * TODO: 实现重试逻辑（单个Agent失败时可重试1次）
   * TODO: 实现并发限制（最多同时N个Agent响应，避免后端过载）
   */
  async dispatch(request: DispatchRequest): Promise<DispatchResult[]> {
    const { targetAgentIds, content, chatHistory } = request;

    const promises = targetAgentIds.map(async (agentId) => {
      try {
        const model = agentRegistry.getModel(agentId);
        if (!model) {
          return { agentId, success: false, error: `Model ${agentId} not found` };
        }

        // TODO: 从 agentStore 获取该Agent的运行时配置
        const config = agentRegistry.getDefaultConfig(agentId);
        if (!config) {
          return { agentId, success: false, error: `Config for ${agentId} not found` };
        }

        // TODO: 构建请求体，调用 agentApi.chat()
        // TODO: 如果是流式响应，通过 streamHandler.handleStream() 处理
        // TODO: 通过 chatStore.appendAIStream() 逐token推送到UI

        return { agentId, success: true };
      } catch (error) {
        return {
          agentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    return Promise.allSettled(promises).then((results) =>
      results.map((r) =>
        r.status === 'fulfilled'
          ? r.value
          : { agentId: 'unknown', success: false, error: r.reason }
      )
    );
  }

  /**
   * 取消指定Agent的正在进行的请求
   * TODO: 实现 AbortController 机制
   */
  cancelAgent(agentId: string): void {
    this.streamHandler.abort(agentId);
  }

  /**
   * 取消所有正在进行的请求
   */
  cancelAll(): void {
    this.streamHandler.abortAll();
  }
}

export const agentDispatcher = new AgentDispatcher();
