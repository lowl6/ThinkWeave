// ============================================================
// ThinkWeave HTTP客户端 — Axios实例 + 拦截器
// ============================================================

import axios from 'axios';
import type { ApiResponse } from '@/types/api';

// TODO: 从环境变量读取 API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- 请求拦截器 ----
client.interceptors.request.use(
  (config) => {
    // TODO: 从认证store获取token，注入 Authorization header
    // const token = useAuthStore.getState().token;
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ---- 响应拦截器 ----
client.interceptors.response.use(
  (response) => {
    // TODO: 统一处理响应格式，解析 ApiResponse<T> wrapper
    return response;
  },
  (error) => {
    // TODO: 统一错误处理
    // - 401: token过期 → 清除认证状态，跳转登录
    // - 403: 无权限 → Toast提示
    // - 429: 限流 → Toast提示"请稍后重试"
    // - 500: 服务器错误 → Toast提示
    // - 网络错误: Toast提示"网络连接失败"
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          // TODO: 跳转登录
          break;
        case 429:
          console.warn('Rate limited, please try again later.');
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default client;
