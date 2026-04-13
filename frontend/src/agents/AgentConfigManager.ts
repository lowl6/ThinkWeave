// ============================================================
// ThinkWeave Agent配置管理器
// 管理Agent的角色模板、参数、知识库绑定
// ============================================================

import type { AgentConfig, AgentRoleTemplate, KnowledgeFile } from '@/types/models';
import { AGENT_ROLE_TEMPLATES, AGENT_PARAM_LIMITS } from '@/utils/constants';
import { isValidTemperature, isValidMaxTokens } from '@/utils/validators';

class AgentConfigManager {
  /**
   * 创建默认Agent配置
   */
  createDefaultConfig(modelId: string): AgentConfig {
    return {
      modelId,
      roleTemplate: 'default',
      systemPrompt: AGENT_ROLE_TEMPLATES.default.systemPrompt,
      temperature: AGENT_PARAM_LIMITS.temperature.default,
      maxTokens: AGENT_PARAM_LIMITS.maxTokens.default,
      knowledgeFiles: [],
      isActive: true,
    };
  }

  /**
   * 应用角色模板到配置
   * TODO: 切换角色模板时替换systemPrompt，保留其他参数不变
   */
  applyTemplate(
    config: AgentConfig,
    template: AgentRoleTemplate
  ): AgentConfig {
    const templateDef = AGENT_ROLE_TEMPLATES[template];
    return {
      ...config,
      roleTemplate: template,
      systemPrompt: templateDef.systemPrompt,
    };
  }

  /**
   * 校验Agent配置合法性
   * TODO: 在保存配置前调用，校验参数范围
   */
  validate(config: AgentConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!isValidTemperature(config.temperature)) {
      errors.push(`Temperature 必须在 0~2 之间，当前值: ${config.temperature}`);
    }

    if (!isValidMaxTokens(config.maxTokens)) {
      errors.push(
        `最大输出长度必须在 500~4000 之间，当前值: ${config.maxTokens}`
      );
    }

    if (config.roleTemplate === 'custom' && !config.systemPrompt.trim()) {
      errors.push('自定义角色必须填写系统提示词');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 序列化配置用于API传输
   * TODO: 去除前端专用字段、知识库只传fileId
   */
  serialize(config: AgentConfig): Record<string, unknown> {
    return {
      model_id: config.modelId,
      system_prompt: config.systemPrompt,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      knowledge_file_ids: config.knowledgeFiles.map((f) => f.id),
    };
  }

  /**
   * 添加知识库文件到Agent配置
   * TODO: 调用 fileApi.upload() 上传文件后，将返回的fileId关联到配置
   * TODO: 校验文件大小和格式
   */
  addKnowledgeFile(
    config: AgentConfig,
    file: KnowledgeFile
  ): AgentConfig {
    // 检查重复
    if (config.knowledgeFiles.some((f) => f.name === file.name)) {
      throw new Error(`文件 ${file.name} 已存在。`);
    }
    return {
      ...config,
      knowledgeFiles: [...config.knowledgeFiles, file],
    };
  }

  /**
   * 移除知识库文件
   * TODO: 调用 fileApi.delete() 删除远端文件
   */
  removeKnowledgeFile(
    config: AgentConfig,
    fileId: string
  ): AgentConfig {
    return {
      ...config,
      knowledgeFiles: config.knowledgeFiles.filter((f) => f.id !== fileId),
    };
  }
}

export const agentConfigManager = new AgentConfigManager();
