// ============================================================
// ThinkWeave 用户/认证API服务
// ============================================================

import client from './client';

// TODO: 设计认证方案（JWT / Session / OAuth）
// TODO: 与后端确认认证流程

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
}

/**
 * 用户登录
 * TODO: 对接 POST /api/auth/login
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await client.post<LoginResponse>('/auth/login', data);
  return res.data;
}

/**
 * 用户注册
 * TODO: 对接 POST /api/auth/register
 */
export async function register(data: {
  username: string;
  password: string;
  name: string;
}): Promise<LoginResponse> {
  const res = await client.post<LoginResponse>('/auth/register', data);
  return res.data;
}

/**
 * 获取当前用户信息
 * TODO: 对接 GET /api/users/me
 */
export async function getCurrentUser(): Promise<LoginResponse['user']> {
  const res = await client.get('/users/me');
  return res.data;
}
