import { useApi } from '../composables/useApi'
import { API_ENDPOINTS } from '../constants/api-endpoints'
import type { ApiResponse } from '../types/api'
import type {
  ApplicantListItemResponse,
  ApplicantSummaryResponse,
  ApplicationDetailResponse,
  ApplicationListQuery,
  ApiPaginatedResponse,
  MyApplicationListItemResponse,
  MyApplicationSummaryResponse,
  ReviewApplicationRequest
} from '../types/application'

export function serializeApplicationQuery(query: ApplicationListQuery): string {
  const params = new URLSearchParams()
  if (query.page !== undefined) params.set('page', String(query.page))
  if (query.limit !== undefined) params.set('limit', String(query.limit))
  const search = query.search?.trim()
  if (search) params.set('search', search)
  if (query.statuses?.length) params.set('statuses', [...new Set(query.statuses)].join(','))
  if (query.project_role_ids?.length) params.set('project_role_ids', [...new Set(query.project_role_ids)].join(','))
  if (query.origins?.length) params.set('origins', [...new Set(query.origins)].join(','))
  if (query.sort) params.set('sort', query.sort)
  return params.toString()
}

const withQuery = (path: string, query: ApplicationListQuery) => {
  const serialized = serializeApplicationQuery(query)
  return serialized ? `${path}?${serialized}` : path
}

export const ApplicationService = {
  async getApplicantSummary(projectId: string, signal?: AbortSignal) {
    const { $api } = useApi()
    return await $api<ApiResponse<ApplicantSummaryResponse>>(
      API_ENDPOINTS.PROJECT.APPLICANT_SUMMARY(projectId), { signal }
    )
  },

  async getProjectApplicants(projectId: string, query: ApplicationListQuery, signal?: AbortSignal) {
    const { $api } = useApi()
    return await $api<ApiPaginatedResponse<ApplicantListItemResponse>>(
      withQuery(API_ENDPOINTS.PROJECT.APPLICANTS(projectId), query), { signal }
    )
  },

  async getApplicationDetail(applicationId: string, signal?: AbortSignal) {
    const { $api } = useApi()
    return await $api<ApiResponse<ApplicationDetailResponse>>(
      API_ENDPOINTS.APPLICATION.DETAIL(applicationId), { signal }
    )
  },

  async getMyApplications(query: ApplicationListQuery, signal?: AbortSignal) {
    const { $api } = useApi()
    return await $api<ApiPaginatedResponse<MyApplicationListItemResponse>>(
      withQuery(API_ENDPOINTS.APPLICATION.MY_APPLICATIONS, query), { signal }
    )
  },

  async getMyApplicationSummary(signal?: AbortSignal) {
    const { $api } = useApi()
    return await $api<ApiResponse<MyApplicationSummaryResponse>>(
      API_ENDPOINTS.APPLICATION.MY_APPLICATION_SUMMARY, { signal }
    )
  },

  async reviewApplication(applicationId: string, request: ReviewApplicationRequest, signal?: AbortSignal) {
    const { $api } = useApi()
    return await $api<ApiResponse<ApplicationDetailResponse>>(
      API_ENDPOINTS.APPLICATION.REVIEW(applicationId),
      {
        method: 'PATCH',
        body: request,
        signal
      }
    )
  },

  async withdrawApplication(applicationId: string, signal?: AbortSignal) {
    const { $api } = useApi()
    return await $api<ApiResponse<ApplicationDetailResponse>>(
      API_ENDPOINTS.APPLICATION.WITHDRAW(applicationId),
      {
        method: 'POST',
        signal
      }
    )
  }
}
