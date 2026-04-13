// ============================================================
// ThinkWeave 通用校验工具
// ============================================================

import { FILE_UPLOAD_LIMITS } from './constants';

/**
 * 校验房间号格式（9位数字）
 */
export function isValidRoomCode(code: string): boolean {
  return /^\d{9}$/.test(code.replace(/\s/g, ''));
}

/**
 * 校验文件是否在允许范围内
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > FILE_UPLOAD_LIMITS.maxSize) {
    return {
      valid: false,
      error: `文件 ${file.name} 超过10MB限制，请选择较小的文件。`,
    };
  }
  if (
    !FILE_UPLOAD_LIMITS.acceptedTypes.includes(
      file.type as (typeof FILE_UPLOAD_LIMITS.acceptedTypes)[number]
    )
  ) {
    return {
      valid: false,
      error: `文件格式不支持，请上传 PDF/Word/TXT/Markdown/JSON 文件。`,
    };
  }
  return { valid: true };
}

/**
 * 校验Temperature参数范围
 */
export function isValidTemperature(value: number): boolean {
  return value >= 0 && value <= 2;
}

/**
 * 校验MaxTokens参数范围
 */
export function isValidMaxTokens(value: number): boolean {
  return value >= 500 && value <= 4000;
}
