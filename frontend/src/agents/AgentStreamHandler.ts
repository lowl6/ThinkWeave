// ============================================================
// ThinkWeave Agent流式响应处理器
// 处理SSE (Server-Sent Events) 流式AI响应
// ============================================================

type StreamCallback = (agentId: string, token: string) => void;
type CompleteCallback = (agentId: string, fullContent: string) => void;
type ErrorCallback = (agentId: string, error: Error) => void;

export class AgentStreamHandler {
  private abortControllers: Map<string, AbortController> = new Map();
  private onToken: StreamCallback | null = null;
  private onComplete: CompleteCallback | null = null;
  private onError: ErrorCallback | null = null;

  /**
   * 注册回调函数
   * TODO: 在组件挂载时注册，连接到 chatStore.appendAIStream
   */
  registerCallbacks(callbacks: {
    onToken: StreamCallback;
    onComplete: CompleteCallback;
    onError: ErrorCallback;
  }): void {
    this.onToken = callbacks.onToken;
    this.onComplete = callbacks.onComplete;
    this.onError = callbacks.onError;
  }

  /**
   * 处理SSE流式响应
   *
   * TODO: 实现完整的SSE流处理
   *   1. 使用 fetch + ReadableStream 读取SSE流
   *   2. 解析 "data: {...}" 格式的SSE消息
   *   3. 对每个token调用 onToken(agentId, token)
   *   4. 流结束时调用 onComplete(agentId, fullContent)
   *   5. 错误时调用 onError(agentId, error)
   *
   * TODO: 处理SSE特殊消息：
   *   - "data: [DONE]" 表示流结束
   *   - 心跳消息 ": keepalive"
   *
   * TODO: 支持 AbortController 中断流
   */
  async handleStream(
    agentId: string,
    url: string,
    body: Record<string, unknown>,
    headers: Record<string, string>
  ): Promise<void> {
    const controller = new AbortController();
    this.abortControllers.set(agentId, controller);

    let fullContent = '';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Agent ${agentId} API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }

      const decoder = new TextDecoder();

      // TODO: 实现SSE解析循环
      // while (true) {
      //   const { done, value } = await reader.read();
      //   if (done) break;
      //   const chunk = decoder.decode(value, { stream: true });
      //   // 解析SSE data行，提取token
      //   // fullContent += token;
      //   // this.onToken?.(agentId, token);
      // }

      this.onComplete?.(agentId, fullContent);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // 用户主动取消，不报错
        return;
      }
      this.onError?.(agentId, error as Error);
    } finally {
      this.abortControllers.delete(agentId);
    }
  }

  /**
   * 中断指定Agent的流
   */
  abort(agentId: string): void {
    const controller = this.abortControllers.get(agentId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(agentId);
    }
  }

  /**
   * 中断所有流
   */
  abortAll(): void {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }

  /**
   * 检查指定Agent是否正在流式响应
   */
  isStreaming(agentId: string): boolean {
    return this.abortControllers.has(agentId);
  }
}
