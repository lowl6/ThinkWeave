// ============================================================
// ThinkWeave 全局类型定义 — 业务实体
// ============================================================

// ---- 用户 & 成员 ----

export interface User {
  id: string;
  name: string;
  avatar: string; // 头像文字或URL
  avatarBg: string; // Tailwind渐变类
  role: MemberRole;
}

export type MemberRole = 'host' | 'member';

export interface RoomMember extends User {
  isOnline: boolean;
  joinedAt: string;
}

// ---- AI Agent ----

export interface AgentModel {
  id: string;
  name: string; // e.g. "DeepSeek V3"
  provider: AgentProvider;
  icon: string; // Font Awesome class e.g. "fa-code"
  iconBg: string; // Tailwind bg class
  iconColor: string; // Tailwind text color class
  statusColor: string; // 状态颜色
  description: string; // 角色定位 e.g. "逻辑推理专家"
}

export type AgentProvider = 'deepseek' | 'wenxin' | 'qianwen' | 'openai';

export type AgentRoleTemplate = 'default' | 'analyst' | 'creative' | 'domain-expert' | 'custom';

export interface AgentConfig {
  modelId: string;
  roleTemplate: AgentRoleTemplate;
  systemPrompt: string;
  temperature: number; // 0-2, default 0.7
  maxTokens: number; // 500-4000, default 2000
  knowledgeFiles: KnowledgeFile[];
  isActive: boolean;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  size: number; // bytes
  type: string; // MIME type
  uploadedAt: string;
}

// ---- 房间 ----

export interface Room {
  id: string;
  roomCode: string; // 9位数字 e.g. "328456789"
  topic: string;
  password?: string;
  createdBy: string; // userId
  createdAt: string;
  agents: AgentConfig[];
  members: RoomMember[];
  workflow: ThinkLetStep[];
  status: RoomStatus;
  elapsedSeconds: number;
}

export type RoomStatus = 'waiting' | 'active' | 'paused' | 'ended';

// ---- 消息 ----

export interface Message {
  id: string;
  roomId: string;
  type: 'user' | 'ai' | 'system';
  senderId: string; // userId or agentId
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  // AI消息特有
  agentIcon?: string;
  agentIconBg?: string;
  agentIconColor?: string;
  // 消息操作
  isAdopted?: boolean;
  score?: number;
}

// ---- ThinkLets ----

export type ThinkLetType =
  | 'FreeBrainstorm'
  | 'LeafHopper'
  | 'FastFocus'
  | 'BucketWalk'
  | 'PopcornSort'
  | 'StrawPoll';

/**
 * ThinkLet 类别
 * - generate: 发散生成（FreeBrainstorm, LeafHopper）
 * - clarify:  聚焦澄清（FastFocus）
 * - organize: 归类整理（BucketWalk, PopcornSort）
 * - evaluate: 评估投票（StrawPoll）
 */
export type ThinkLetCategory = 'generate' | 'clarify' | 'organize' | 'evaluate';

export interface ThinkLetStep {
  id: string;
  type: ThinkLetType;
  title: string;
  prompt: string;
  durationMinutes: number;
  order: number;
}

export type WorkflowTemplate = 'custom' | 'brainstorm' | 'deep-analysis' | 'rapid-convergence';

// ---- ThinkLet 环节运行时数据 ----

/** FreeBrainstorm / LeafHopper 共用 — 发散阶段产出的观点 */
export interface BrainstormContribution {
  id: string;
  ideaId: string; // 关联Idea
  authorId: string; // userId 或 agentId
  authorType: 'user' | 'ai';
  round: number; // LeafHopper轮次编号, FreeBrainstorm统一为1
  parentIdeaId?: string; // LeafHopper: 基于哪条观点发散的
}

/** FastFocus — 聚焦澄清投票数据 */
export interface FocusVote {
  id: string;
  ideaId: string;
  voterId: string;
  voteType: 'keep' | 'merge' | 'discard';
  comment?: string; // 澄清意见
}

/** BucketWalk — 桶分类数据 */
export interface Bucket {
  id: string;
  label: string;
  description: string;
  color: string; // 显示颜色
  order: number;
}

export interface BucketAssignment {
  id: string;
  ideaId: string;
  bucketId: string;
  assignedBy: string; // userId
}

/** StrawPoll — 投票数据 */
export interface PollBallot {
  id: string;
  ideaId: string;
  voterId: string;
  points: number; // 分配的点数
}

export interface PollResult {
  ideaId: string;
  totalPoints: number;
  voterCount: number;
  rank: number;
}

// ---- 灵感 & 观点 ----

export interface Idea {
  id: string;
  content: string;
  source: string; // agent name or user name
  sourceColor: string; // 左侧边框颜色
  createdAt: string;
  isSelected: boolean;
  clusterId?: string;
}

export interface Cluster {
  id: string;
  label: string;
  ideaIds: string[];
}

// ---- 订阅 ----

export type SubscriptionTier = 'free' | 'pro' | 'team';
export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isRecommended: boolean;
}
