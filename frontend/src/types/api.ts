// ============================================================
// ThinkWeave API 请求/响应类型定义
// ============================================================

import type {
  Room,
  Message,
  AgentConfig,
  ThinkLetStep,
  Idea,
  Cluster,
  SubscriptionPlan,
} from './models';

// ---- 通用 ----

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---- 房间 API ----

// TODO: 与后端对齐创建房间请求体字段
export interface CreateRoomRequest {
  topic: string;
  password?: string;
  agents: AgentConfig[];
  workflow: Omit<ThinkLetStep, 'id'>[];
}

export interface CreateRoomResponse {
  room: Room;
}

export interface JoinRoomRequest {
  roomCode: string;
  password?: string;
}

// ---- 对话 API ----

// TODO: 与后端对齐消息发送请求体，支持流式响应标识
export interface SendMessageRequest {
  roomId: string;
  content: string;
  targetAgentIds: string[]; // 指定哪些Agent响应
}

export interface SendMessageResponse {
  userMessage: Message;
  // AI响应通过SSE/WebSocket异步推送
}

// ---- Agent API ----

// TODO: 与后端对齐AI调用接口，确认是否统一走网关还是分模型直连
export interface AgentChatRequest {
  agentId: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  config: {
    temperature: number;
    maxTokens: number;
  };
  stream: boolean;
}

export interface AgentChatResponse {
  agentId: string;
  content: string;
  finishReason: 'stop' | 'length' | 'error';
}

// ---- 文件 API ----

// TODO: 确认上传接口是否支持分片上传（大文件场景）
export interface UploadFileResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
}

// ---- 头脑风暴 & 观点 API ----

export interface ExtractIdeasRequest {
  roomId: string;
  messageIds: string[];
}

export interface ExtractIdeasResponse {
  ideas: Idea[];
}

export interface SemanticClusterRequest {
  roomId: string;
  ideaIds: string[];
}

export interface SemanticClusterResponse {
  clusters: Cluster[];
}

// ---- 订阅 API ----

export interface GetPlansResponse {
  plans: SubscriptionPlan[];
}

// TODO: 对接支付网关（微信支付/支付宝），定义支付回调类型
export interface CreateOrderRequest {
  planTier: string;
  billingCycle: string;
}

export interface CreateOrderResponse {
  orderId: string;
  paymentUrl: string;
}
