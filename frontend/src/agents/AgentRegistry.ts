// ============================================================
// ThinkWeave Agent注册表
// 管理所有可用AI模型的注册、查询、动态扩展
// ============================================================

import type { AgentModel, AgentConfig } from '@/types/models';
import { BUILT_IN_AGENTS, AGENT_ROLE_TEMPLATES } from '@/utils/constants';

class AgentRegistry {
  private models: Map<string, AgentModel> = new Map();
  private defaultConfigs: Map<string, AgentConfig> = new Map();

  constructor() {
    // TODO: 从后端获取可用模型列表，合并内置模型
    this.initBuiltInModels();
  }

  private initBuiltInModels(): void {
    BUILT_IN_AGENTS.forEach((model) => {
      this.models.set(model.id, model);
      // 为每个内置模型创建默认配置
      this.defaultConfigs.set(model.id, {
        modelId: model.id,
        roleTemplate: 'default',
        systemPrompt: AGENT_ROLE_TEMPLATES.default.systemPrompt,
        temperature: 0.7,
        maxTokens: 2000,
        knowledgeFiles: [],
        isActive: false,
      });
    });
  }

  /**
   * 注册新的Agent模型
   * TODO: 支持运行时从后端动态拉取第三方模型并注册
   * TODO: 添加模型健康检查（ping endpoint）
   */
  register(model: AgentModel): void {
    if (this.models.has(model.id)) {
      console.warn(`Agent model ${model.id} already registered, overwriting.`);
    }
    this.models.set(model.id, model);
  }

  /**
   * 注销Agent模型
   */
  unregister(modelId: string): void {
    this.models.delete(modelId);
    this.defaultConfigs.delete(modelId);
  }

  /**
   * 获取指定模型信息
   */
  getModel(modelId: string): AgentModel | undefined {
    return this.models.get(modelId);
  }

  /**
   * 获取所有已注册模型
   */
  getAllModels(): AgentModel[] {
    return Array.from(this.models.values());
  }

  /**
   * 获取模型默认配置
   */
  getDefaultConfig(modelId: string): AgentConfig | undefined {
    return this.defaultConfigs.get(modelId);
  }

  /**
   * 检查模型是否已注册
   */
  has(modelId: string): boolean {
    return this.models.has(modelId);
  }
}

// 单例
export const agentRegistry = new AgentRegistry();
