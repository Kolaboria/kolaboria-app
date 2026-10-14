import { useApi } from './useApi'
import { API_ENDPOINTS } from '../constants/api-endpoints'
import type { ApiResponse } from '../types/api'
import type { ProjectDetailResponse, ProjectLifecycleGateway } from '../types/project-editor'
import { toUserFacingError } from '../utils/error'

export const createProjectLifecycleApi = (
  request: <T>(path: string, options?: Record<string, unknown>) => Promise<ApiResponse<T>>
): ProjectLifecycleGateway => ({
  async changeStatus(id, body) {
    const response = await request<ProjectDetailResponse>(API_ENDPOINTS.PROJECT.STATUS(id), { method: 'PATCH', body })
    if (response.status < 200 || response.status >= 300 || !response.data) {
      throw toUserFacingError(response, 'Status proyek belum dapat diperbarui.')
    }
    return response.data
  },
  async deleteDraft(id, body) {
    const response = await request<null>(API_ENDPOINTS.PROJECT.DETAIL_BY_ID(id), { method: 'DELETE', body })
    if (response.status < 200 || response.status >= 300) {
      throw toUserFacingError(response, 'Draft proyek belum dapat dihapus.')
    }
  }
})

export const useProjectLifecycleApi = (): ProjectLifecycleGateway => {
  const { $api } = useApi()
  return createProjectLifecycleApi(<T>(path: string, options?: Record<string, unknown>) =>
    $api<ApiResponse<T>>(path, options as Parameters<typeof $api>[1])
  )
}
