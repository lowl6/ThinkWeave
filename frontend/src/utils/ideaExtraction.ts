/**
 * 观点提取公共函数 — 对应后端 shared/idea_extraction.py
 * 从文本中提取结构化观点（前端本地 + 可调后端AI精炼）
 */
import { apiClient } from '@/services/api/client';

export interface ExtractedIdea {
  content: string;
  source: string;
}

/**
 * 本地正则提取：按换行符/编号拆分文本为独立观点
 */
export function extractIdeasFromText(text: string): ExtractedIdea[] {
  if (!text.trim()) return [];

  const lines = text
    .split(/\n/)
    .map((l) => l.replace(/^\s*[\d]+[.、)）]\s*/, '').trim())
    .filter((l) => l.length > 2);

  return lines.map((content) => ({ content, source: 'text' }));
}

/**
 * 调用后端AI精炼提取
 */
export async function refineIdeasWithAI(
  rawText: string,
  roomId: string,
  stepId: string,
): Promise<ExtractedIdea[]> {
  const res = await apiClient.post('/api/ideas/extract', {
    text: rawText,
    room_id: roomId,
    step_id: stepId,
  });
  return res.data.ideas;
}
