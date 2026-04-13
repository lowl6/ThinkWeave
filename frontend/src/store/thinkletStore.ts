// ============================================================
// ThinkWeave ThinkLets流程状态管理 — Zustand Store
// ============================================================

import { create } from 'zustand';
import type { ThinkLetStep, WorkflowTemplate } from '@/types/models';

interface ThinkletState {
  // ---- 流程步骤 ----
  steps: ThinkLetStep[];

  // ---- 当前执行状态 ----
  currentStepIndex: number; // 当前所处环节索引
  isRunning: boolean;
  remainingSeconds: number; // 当前环节剩余秒数

  // ---- 选择的模板 ----
  selectedTemplate: WorkflowTemplate;

  // ---- Actions ----

  // TODO: 加载预设模板 → 用对应模板的步骤替换当前steps
  //       模板定义：brainstorm=[发散→筛选→投票→总结], sixhats=[白→黑→绿→蓝], swot=[SWOT矩阵]
  loadTemplate: (template: WorkflowTemplate) => void;

  // TODO: AI智能设计流程 → 调用agentApi传入主题 → 解析返回的步骤列表 → 替换steps
  //       需要在调用期间显示"AI思考中..."加载状态
  aiDesignWorkflow: (topic: string) => Promise<void>;

  // TODO: 添加新流程环节到末尾
  addStep: (step: Omit<ThinkLetStep, 'id' | 'order'>) => void;

  // TODO: 删除指定环节
  removeStep: (stepId: string) => void;

  // TODO: 更新指定环节配置（标题/时长/Prompt）
  updateStep: (stepId: string, updates: Partial<ThinkLetStep>) => void;

  // TODO: 计算总时长（所有step的durationMinutes之和）
  getTotalMinutes: () => number;

  // TODO: 切换到下一个环节（当前环节倒计时结束或手动点击"下一步"）
  nextStep: () => void;

  // TODO: 每秒递减 remainingSeconds（由useCountdown驱动）
  tickCountdown: () => void;

  // TODO: 开始执行流程（从第一个环节开始）
  startWorkflow: () => void;

  // TODO: 结束当前环节
  endCurrentStep: () => void;

  // TODO: 重置流程状态
  resetWorkflow: () => void;
}

// TODO: 实现所有action函数体
export const useThinkletStore = create<ThinkletState>((set, get) => ({
  steps: [],
  currentStepIndex: 0,
  isRunning: false,
  remainingSeconds: 0,
  selectedTemplate: 'custom',

  loadTemplate: (template) => {
    // TODO: 根据template类型生成对应steps数组
    // 使用 THINKLET_META 中的元数据
    set({ selectedTemplate: template });
  },

  aiDesignWorkflow: async (topic) => {
    // TODO: 调用 agentApi 让AI根据主题设计流程
    // 1. 校验topic非空
    // 2. 发送请求，解析AI返回的步骤JSON
    // 3. 设置到steps
    throw new Error('Not implemented');
  },

  addStep: (step) => {
    const { steps } = get();
    const newStep: ThinkLetStep = {
      ...step,
      id: crypto.randomUUID(),
      order: steps.length,
    };
    set({ steps: [...steps, newStep] });
  },

  removeStep: (stepId) => {
    set((state) => ({
      steps: state.steps
        .filter((s) => s.id !== stepId)
        .map((s, i) => ({ ...s, order: i })),
    }));
  },

  updateStep: (stepId, updates) => {
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId ? { ...s, ...updates } : s
      ),
    }));
  },

  getTotalMinutes: () => {
    return get().steps.reduce((sum, s) => sum + s.durationMinutes, 0);
  },

  nextStep: () => {
    const { currentStepIndex, steps } = get();
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      set({
        currentStepIndex: nextIndex,
        remainingSeconds: steps[nextIndex].durationMinutes * 60,
      });
    }
  },

  tickCountdown: () => {
    const { remainingSeconds } = get();
    if (remainingSeconds > 0) {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },

  startWorkflow: () => {
    const { steps } = get();
    if (steps.length > 0) {
      set({
        isRunning: true,
        currentStepIndex: 0,
        remainingSeconds: steps[0].durationMinutes * 60,
      });
    }
  },

  endCurrentStep: () => {
    set({ remainingSeconds: 0 });
  },

  resetWorkflow: () => {
    set({
      steps: [],
      currentStepIndex: 0,
      isRunning: false,
      remainingSeconds: 0,
      selectedTemplate: 'custom',
    });
  },
}));
