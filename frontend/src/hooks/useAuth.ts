// ============================================================
// ThinkWeave 认证状态Hook
// ============================================================

// TODO: 实现完整认证状态管理
//   - 从localStorage恢复token
//   - 提供登录/登出方法
//   - token过期自动跳转登录
//   - 获取当前用户信息

export function useAuth() {
  // TODO: 创建 authStore 或使用独立的认证状态
  // 临时返回硬编码的用户
  return {
    isAuthenticated: true,
    user: {
      id: 'user-1',
      name: '刘承枭',
      avatar: '刘',
      role: 'host' as const,
    },
    login: async (_username: string, _password: string) => {
      // TODO: 调用 userApi.login()
      throw new Error('Not implemented');
    },
    logout: () => {
      // TODO: 清除token，重定向到登录页
    },
  };
}
