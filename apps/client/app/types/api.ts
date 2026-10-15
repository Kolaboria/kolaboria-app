export interface ApiResponse<T = unknown, TMeta = ApiPaginationMeta> {
  status: number
  message: string
  data?: T
  meta?: TMeta
}

export interface ApiErrorResponse {
  status: number
  message: string
  data?: { trace_id?: string; err_message?: string }
  errors?: Record<string, string[]> | string
}

export interface ApiPaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface ApiPaginatedResponse<T = unknown> extends ApiResponse<T[], ApiPaginationMeta> {
  data: T[]
  meta: ApiPaginationMeta
}
