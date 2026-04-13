// ============================================================
// ThinkWeave 全局常量定义
// ============================================================

import type { AgentModel, SubscriptionPlan } from '@/types/models';

// ---- 内置AI模型定义 ----

export const BUILT_IN_AGENTS: AgentModel[] = [
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    icon: 'fa-code',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    statusColor: '#3b82f6',
    description: '逻辑推理专家',
  },
  {
    id: 'wenxin',
    name: '文心一言',
    provider: 'wenxin',
    icon: 'fa-brain',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    statusColor: '#6366f1',
    description: '知识整合专家',
  },
  {
    id: 'qianwen',
    name: '通义千问',
    provider: 'qianwen',
    icon: 'fa-cloud',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    statusColor: '#f97316',
    description: '创意发散',
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    icon: 'fa-bolt',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    statusColor: '#22c55e',
    description: '通用能力',
  },
];

// ---- ThinkLet 类型元数据 ----

export const THINKLET_META = {
  FreeBrainstorm: {
    name: '自由头脑风暴',
    nameEn: 'FreeBrainstorm',
    category: 'generate' as const,
    categoryLabel: '发散生成',
    color: 'green',
    tailwindColor: 'emerald',
    icon: 'fa-bolt',
    description: '所有参与者自由产生想法，AI同步发散，观点自动进入灵感池',
    aiCapabilities: ['观点生成', '观点精炼提取'],
    defaultDuration: 10,
  },
  LeafHopper: {
    name: '接龙发散',
    nameEn: 'LeafHopper',
    category: 'generate' as const,
    categoryLabel: '发散生成',
    color: 'teal',
    tailwindColor: 'teal',
    icon: 'fa-leaf',
    description: '基于已有观点多轮跳跃式发散，每轮在前一轮观点基础上拓展新想法',
    aiCapabilities: ['观点生成', '观点精炼提取', '关联拓展'],
    defaultDuration: 15,
  },
  FastFocus: {
    name: '快速聚焦',
    nameEn: 'FastFocus',
    category: 'clarify' as const,
    categoryLabel: '聚焦澄清',
    color: 'yellow',
    tailwindColor: 'amber',
    icon: 'fa-crosshairs',
    description: '对观点池进行快速表决（保留/合并/舍弃），澄清并收窄范围',
    aiCapabilities: ['观点精炼提取', '相似度检测'],
    defaultDuration: 8,
  },
  BucketWalk: {
    name: '桶分类',
    nameEn: 'BucketWalk',
    category: 'organize' as const,
    categoryLabel: '归类整理',
    color: 'purple',
    tailwindColor: 'violet',
    icon: 'fa-bucket',
    description: '预设分类桶，参与者将观点拖入对应桶中，AI辅助自动归类',
    aiCapabilities: ['语义聚类', '观点精炼提取'],
    defaultDuration: 10,
  },
  PopcornSort: {
    name: '米花拾掇',
    nameEn: 'PopcornSort',
    category: 'organize' as const,
    categoryLabel: '归类整理',
    color: 'orange',
    tailwindColor: 'orange',
    icon: 'fa-arrow-down-short-wide',
    description: '逐条浏览观点，快速决定保留/舍弃/合并，AI辅助语义聚类和去重',
    aiCapabilities: ['语义聚类', '去重合并', '观点精炼提取'],
    defaultDuration: 10,
  },
  StrawPoll: {
    name: '麦秆投票',
    nameEn: 'StrawPoll',
    category: 'evaluate' as const,
    categoryLabel: '评估投票',
    color: 'blue',
    tailwindColor: 'blue',
    icon: 'fa-check-to-slot',
    description: '每人分配固定票数/点数，对观点进行投票排序，得出优先级',
    aiCapabilities: ['观点精炼提取', '结果汇总'],
    defaultDuration: 8,
  },
} as const;

// ---- 角色模板 ----

export const AGENT_ROLE_TEMPLATES = {
  default: {
    label: '默认模板',
    description: '平衡的通用助手，适合大多数场景',
    tag: '推荐',
    systemPrompt: '你是一个专业的AI协作助手，请帮助团队进行深入研讨。',
  },
  analyst: {
    label: '分析专家',
    description: '深度分析、数据洞察、逻辑推理',
    tag: null,
    systemPrompt: '你是一个数据分析专家，擅长深度分析、逻辑推理和数据洞察。请从数据和逻辑角度提供见解。',
  },
  creative: {
    label: '创意顾问',
    description: '头脑风暴、创新思维、多角度思考',
    tag: null,
    systemPrompt: '你是一个创意顾问，擅长头脑风暴和多角度创新思维。请提供新颖独特的观点和创意方案。',
  },
  'domain-expert': {
    label: '领域专家',
    description: '专业知识、实践经验、深度见解',
    tag: null,
    systemPrompt: '你是一个领域专家，拥有丰富的专业知识和实践经验。请从专业角度提供深度见解。',
  },
  custom: {
    label: '自定义角色',
    description: '完全自定义系统提示词和行为模式',
    tag: null,
    systemPrompt: '',
  },
} as const;

// ---- 订阅套餐 ----

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: '基础版',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      '40分钟房间时长',
      '1人 + 2个AI协作',
      'DeepSeek-Lite 模型',
      '基础头脑风暴流程',
    ],
    isRecommended: false,
  },
  {
    tier: 'pro',
    name: '专业版',
    priceMonthly: 29,
    priceYearly: 290,
    features: [
      '24小时房间时长',
      '5人 + 5个AI协作',
      'DeepSeek V3, GPT-4o',
      '500MB知识库上传',
      '全部6种 ThinkLets 环节',
    ],
    isRecommended: true,
  },
  {
    tier: 'team',
    name: '团队版',
    priceMonthly: -1, // 定制
    priceYearly: -1,
    features: [
      '不限时房间',
      '50+人 + 大规模AI',
      '企业级模型',
      '10GB知识库',
      '自定义ThinkLets',
      'API接入',
      '专属客服',
    ],
    isRecommended: false,
  },
];

// ---- 输出数量选项 ----

export const OUTPUT_COUNT_OPTIONS = [1, 3, 5] as const;

// ---- 文件上传限制 ----

export const FILE_UPLOAD_LIMITS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  acceptedTypes: [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
    'application/json',
  ],
} as const;

// ---- Agent 参数范围 ----

export const AGENT_PARAM_LIMITS = {
  temperature: { min: 0, max: 2, default: 0.7, step: 0.1 },
  maxTokens: { min: 500, max: 4000, default: 2000, step: 100 },
} as const;
