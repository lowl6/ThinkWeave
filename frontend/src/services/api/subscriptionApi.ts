// ============================================================
// ThinkWeave 订阅付费API服务
// ============================================================

import client from './client';
import type { GetPlansResponse, CreateOrderRequest, CreateOrderResponse } from '@/types/api';

/**
 * 获取订阅套餐列表
 * TODO: 对接 GET /api/subscriptions/plans
 */
export async function getPlans(): Promise<GetPlansResponse> {
  const res = await client.get<GetPlansResponse>('/subscriptions/plans');
  return res.data;
}

/**
 * 创建订阅订单
 * TODO: 对接 POST /api/subscriptions/orders
 * TODO: 对接微信支付/支付宝支付网关
 */
export async function createOrder(
  data: CreateOrderRequest
): Promise<CreateOrderResponse> {
  const res = await client.post<CreateOrderResponse>(
    '/subscriptions/orders',
    data
  );
  return res.data;
}

/**
 * 获取当前用户订阅状态
 * TODO: 对接 GET /api/subscriptions/current
 */
export async function getCurrentSubscription(): Promise<{
  tier: string;
  expiresAt: string;
}> {
  const res = await client.get('/subscriptions/current');
  return res.data;
}
