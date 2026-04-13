/**
 * 语义相似度/聚类 公共函数 — 对应后端 shared/semantic_cluster.py
 * 前端调用后端聚类接口的封装
 */
import { apiClient } from '@/services/api/client';

export interface ClusterResult {
  cluster_id: string;
  label: string;
  idea_ids: string[];
}

/**
 * 请求后端对指定环节的观点进行语义聚类
 */
export async function clusterIdeas(stepId: string): Promise<ClusterResult[]> {
  const res = await apiClient.post(`/api/thinklets/popcornsort/${stepId}/cluster`);
  return res.data;
}

/**
 * 请求后端检测重复观点
 */
export async function detectDuplicates(stepId: string): Promise<string[]> {
  const res = await apiClient.post(`/api/thinklets/popcornsort/${stepId}/deduplicate`);
  return res.data.removed_ids;
}
