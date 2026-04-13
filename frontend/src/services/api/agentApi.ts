// ============================================================
// ThinkWeave AI模型调用API服务
// ============================================================

import client from './client';
import type {
  AgentChatRequest,
  AgentChatResponse,
  ExtractIdeasRequest,
  ExtractIdeasResponse,
  SemanticClusterRequest,
  SemanticClusterResponse,
} from '@/types/api';

// TODO: 确认AI调用是统一走后端网关，还是前端直连各模型provider

/**
 * 调用AI模型（非流式）
 * TODO: 对接 POST /api/agents/chat
 */
export async function agentChat(
  data: AgentChatRequest
): Promise<AgentChatResponse> {
  const res = await client.post<AgentChatResponse>('/agents/chat', data);
  return res.data;
}

/**
 * 调用AI模型（流式SSE）
 * TODO: 对接 POST /api/agents/chat/stream
 * TODO: 返回的是SSE流，需要在 AgentStreamHandler 中处理
 *       此函数返回stream端点URL和请求body，由StreamHandler消费
 */
export function getStreamEndpoint(agentId: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  return `${baseUrl}/agents/chat/stream`;
}

/**
 * AI观点提取
 * TODO: 对接 POST /api/agents/extract-ideas
 */
export async function extractIdeas(
  data: ExtractIdeasRequest
): Promise<ExtractIdeasResponse> {
  const res = await client.post<ExtractIdeasResponse>(
    '/agents/extract-ideas',
    data
  );
  return res.data;
}

/**
 * AI语义聚类
 * TODO: 对接 POST /api/agents/semantic-cluster
 */
export async function semanticCluster(
  data: SemanticClusterRequest
): Promise<SemanticClusterResponse> {
  const res = await client.post<SemanticClusterResponse>(
    '/agents/semantic-cluster',
    data
  );
  return res.data;
}

/**
 * AI智能流程设计
 * TODO: 对接 POST /api/agents/design-workflow
 */
export async function designWorkflow(
  topic: string
): Promise<{ steps: { type: string; title: string; durationMinutes: number; prompt: string }[] }> {
  const res = await client.post('/agents/design-workflow', { topic });
  return res.data;
}
