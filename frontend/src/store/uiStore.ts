// ============================================================
// ThinkWeave UI状态管理 — Zustand Store
// ============================================================

import { create } from 'zustand';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIState {
  // ---- 面板开关 ----
  isMemberPanelOpen: boolean;
  isAdoptedPanelOpen: boolean;

  // ---- 模态框 ----
  activeModal:
    | 'invite'
    | 'ai-config'
    | 'add-ai'
    | 'join-room'
    | null;
  modalData: Record<string, unknown>; // 传递给模态框的数据

  // ---- Toast通知 ----
  toasts: ToastItem[];

  // ---- 头脑风暴模式 ----
  isBrainstormMode: boolean;

  // ---- Actions ----
  toggleMemberPanel: () => void;
  toggleAdoptedPanel: () => void;
  openModal: (modal: UIState['activeModal'], data?: Record<string, unknown>) => void;
  closeModal: () => void;
  addToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
  toggleBrainstormMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMemberPanelOpen: true,
  isAdoptedPanelOpen: false,
  activeModal: null,
  modalData: {},
  toasts: [],
  isBrainstormMode: false,

  toggleMemberPanel: () =>
    set((state) => ({ isMemberPanelOpen: !state.isMemberPanelOpen })),

  toggleAdoptedPanel: () =>
    set((state) => ({ isAdoptedPanelOpen: !state.isAdoptedPanelOpen })),

  openModal: (modal, data = {}) =>
    set({ activeModal: modal, modalData: data }),

  closeModal: () =>
    set({ activeModal: null, modalData: {} }),

  addToast: (message, type = 'success') => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    // TODO: 2秒后自动移除 — 需要在组件层用useEffect + setTimeout实现
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  toggleBrainstormMode: () =>
    set((state) => ({ isBrainstormMode: !state.isBrainstormMode })),
}));
