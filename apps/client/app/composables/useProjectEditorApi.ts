import { useApi } from './useApi'
import { API_ENDPOINTS } from '../constants/api-endpoints'
import type { ApiResponse } from '../types/api'
import type {
  CreateProjectDraftRequest,
  ProjectDetailResponse,
  ProjectEditorPersistence,
  PublishNewProjectRequest,
  PublishProjectRequest,
  UpdateProjectDefinitionRequest
} from '../types/project-editor'
import { toUserFacingError } from '../utils/error'

export const createProjectEditorApi = (
  request: <T>(path: string, options?: Record<string, unknown>) => Promise<ApiResponse<T>>
): ProjectEditorPersistence => {
  const readData = async (promise: Promise<ApiResponse<ProjectDetailResponse>>) => {
    const response = await promise
    if (response.status < 200 || response.status >= 300 || !response.data) {
      throw toUserFacingError(response, 'Respons proyek belum dapat diproses.')
    }
    return response.data
  }

  return {
    create: (body: CreateProjectDraftRequest) => readData(request<ProjectDetailResponse>(
      API_ENDPOINTS.PROJECT.EDITOR_CREATE,
      { method: 'POST', body }
    )),
    publishNew: (body: PublishNewProjectRequest) => readData(request<ProjectDetailResponse>(
      API_ENDPOINTS.PROJECT.EDITOR_PUBLISH_NEW,
      { method: 'POST', body }
    )),
    update: (id: string, body: UpdateProjectDefinitionRequest) => readData(request<ProjectDetailResponse>(
      API_ENDPOINTS.PROJECT.EDITOR_UPDATE(id),
      { method: 'PUT', body }
    )),
    publish: (id: string, body: PublishProjectRequest) => readData(request<ProjectDetailResponse>(
      API_ENDPOINTS.PROJECT.EDITOR_PUBLISH(id),
      { method: 'POST', body }
    )),
    loadBySlug: (slug: string) => readData(request<ProjectDetailResponse>(
      API_ENDPOINTS.PROJECT.DETAIL_BY_SLUG(slug)
    ))
  }
}

export const useProjectEditorApi = (): ProjectEditorPersistence => {
  const { $api } = useApi()
  return createProjectEditorApi(<T>(path: string, options?: Record<string, unknown>) =>
    $api<ApiResponse<T>>(path, options as Parameters<typeof $api>[1])
  )
}
