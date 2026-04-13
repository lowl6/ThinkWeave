// ============================================================
// ThinkWeave 文件大小格式化工具
// ============================================================

/**
 * 将字节数格式化为人类可读字符串
 * e.g. 1024000 → "1000.0 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * 根据MIME类型获取文件图标 Font Awesome class
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'fa-file-pdf';
  if (mimeType.includes('word') || mimeType.includes('document'))
    return 'fa-file-word';
  if (mimeType.includes('json')) return 'fa-file-code';
  if (mimeType.includes('markdown') || mimeType.includes('text'))
    return 'fa-file-lines';
  return 'fa-file';
}
