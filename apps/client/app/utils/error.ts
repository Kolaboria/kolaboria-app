import {
  API_ERROR_MESSAGES,
  ERROR_MESSAGES,
  ERROR_PAGE_CONTENT,
  HTTP_ERROR_MESSAGES
} from '../constants/error-messages'

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object'
    ? value as Record<string, unknown>
    : undefined

const asStatus = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isInteger(value) && value >= 400 && value <= 599
    ? value
    : undefined

/** Supports ofetch, Nuxt errors and a direct API error envelope. */
export const getApiErrorStatus = (error: unknown): number | undefined => {
  const record = asRecord(error)
  const data = asRecord(record?.data)
  const response = asRecord(record?.response)
  const statuses = [record?.statusCode, record?.status, response?.status, data?.status]
    .map(asStatus)
  // A server failure must never be disguised by a conflicting body status.
  return statuses.find((status) => status !== undefined && status >= 500)
    ?? statuses.find((status) => status !== undefined)
}

/**
 * Only frontend-owned copy reaches the UI; raw message/errors are never returned.
 * Supply a static UI fallback, never error.message or text from an API response.
 */
export const getApiErrorMessage = (
  error: unknown,
  fallback: string = ERROR_MESSAGES.general
): string => {
  if (error instanceof UserFacingError) return error.message

  const status = getApiErrorStatus(error)
  if (status !== undefined && status >= 500) return ERROR_MESSAGES.unavailable

  const record = asRecord(error)
  const data = asRecord(record?.data)
  const candidate = data?.message ?? record?.message
  if (typeof candidate === 'string') {
    const key = candidate.trim().toLowerCase()
    // Nuxt may serialize a safe transport error into a plain object.
    const safeMessage = Object.values(ERROR_MESSAGES).find((message) => message.toLowerCase() === key)
    if (safeMessage) return safeMessage
    // Object.hasOwn avoids prototype keys such as constructor or __proto__.
    if (Object.hasOwn(API_ERROR_MESSAGES, key)) {
      const messageKey = API_ERROR_MESSAGES[key]
      if (messageKey) return ERROR_MESSAGES[messageKey]
    }
  }

  if (status !== undefined) {
    const messageKey = HTTP_ERROR_MESSAGES[status]
    return messageKey ? ERROR_MESSAGES[messageKey] : fallback
  }

  if (record?.name === 'TimeoutError' || record?.name === 'AbortError') {
    return ERROR_MESSAGES.timeout
  }
  if (record?.code === 'ERR_NETWORK' || (typeof candidate === 'string' &&
    ['failed to fetch', 'fetch failed', 'networkerror when attempting to fetch resource.']
      .includes(candidate.trim().toLowerCase()))) {
    return ERROR_MESSAGES.network
  }
  // ofetch wraps browser failures as cause; only inspect known names/codes/text.
  const cause = asRecord(record?.cause)
  if (cause?.name === 'TimeoutError' || cause?.name === 'AbortError') {
    return ERROR_MESSAGES.timeout
  }
  if (cause?.code === 'ERR_NETWORK' || (typeof cause?.message === 'string' &&
    ['failed to fetch', 'fetch failed', 'networkerror when attempting to fetch resource.']
      .includes(cause.message.trim().toLowerCase()))) {
    return ERROR_MESSAGES.network
  }
  return fallback
}

/** Safe transport error. The original failure stays in cause for diagnostics. */
export class UserFacingError extends Error {
  readonly statusCode?: number
  readonly status?: number
  readonly verificationResendAvailableAt?: string
  readonly data: { status?: number; message: string; data?: { trace_id?: string; err_message?: string } }

  constructor(error: unknown, fallback?: string) {
    super(getApiErrorMessage(error, fallback), { cause: error })
    this.name = 'UserFacingError'
    this.statusCode = getApiErrorStatus(error)
    this.status = this.statusCode
    const record = asRecord(error)
    const payload = asRecord(record?.data)
    const details = asRecord(payload?.data)
    const metadata = asRecord(payload?.errors)
    const availableAt = details?.verification_resend_available_at
      ?? payload?.verification_resend_available_at
      ?? metadata?.verification_resend_available_at
      ?? metadata?.verificationResendAvailableAt
    if (typeof availableAt === 'string' && Number.isFinite(Date.parse(availableAt))) {
      this.verificationResendAvailableAt = availableAt
    }
    const traceId = details?.trace_id ?? payload?.trace_id
    const errMessage = details?.err_message
    this.data = {
      status: this.statusCode,
      message: this.message,
      ...(typeof traceId === 'string' || typeof errMessage === 'string'
        ? { data: {
            ...(typeof traceId === 'string' ? { trace_id: traceId } : {}),
            ...(typeof errMessage === 'string' ? { err_message: errMessage } : {})
          } }
        : {})
    }
  }
}

export const toUserFacingError = (error: unknown, fallback?: string): UserFacingError =>
  error instanceof UserFacingError ? error : new UserFacingError(error, fallback)

/** Catch failed API envelopes even when the transport mistakenly returns HTTP success. */
export const assertApiResponse = <T>(response: T): T => {
  if (asStatus(asRecord(response)?.status) !== undefined) {
    throw toUserFacingError(response)
  }
  return response
}

export const getErrorPageContent = (error: unknown) => {
  const status = getApiErrorStatus(error)
  if (status === 404 || status === 410) return ERROR_PAGE_CONTENT.missing
  if (status === 401 || status === 403) return ERROR_PAGE_CONTENT.forbidden
  return ERROR_PAGE_CONTENT.general
}
