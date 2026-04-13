// ============================================================
// ThinkWeave 时间格式化工具
// ============================================================

/**
 * 将秒数格式化为 HH:MM:SS
 * TODO: 补充国际化支持（如需中文"时分秒"格式）
 */
export function formatElapsedTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}

/**
 * 将秒数格式化为 MM:SS 倒计时格式
 */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 格式化消息时间戳 → "14:30" 或 "2026-01-13 14:31"
 */
export function formatMessageTime(isoString: string, full = false): string {
  const date = new Date(isoString);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (!full) return time;
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `${dateStr} ${time}`;
}
