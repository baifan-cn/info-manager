/**
 * 错误消息处理工具
 */

/**
 * 从错误对象中提取有意义的错误消息
 * @param error - 未知类型的错误对象
 * @returns 用户友好的错误消息字符串
 */
export function resolveErrorMessage(error: unknown): string {
  if (!error) return '操作失败，请稍后重试'

  if (typeof error === 'string') return error

  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    const message = (error as { message?: string }).message
    if (message) return message
  }

  return '操作失败，请稍后重试'
}