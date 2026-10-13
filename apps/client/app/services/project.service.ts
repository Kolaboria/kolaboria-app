import { useApi } from '../composables/useApi'
import { API_ENDPOINTS } from '../constants/api-endpoints'
import type { ApiPaginatedResponse, ApiResponse } from '../types/api'
import type {
  Project,
  CreateProjectPayload,
  ApplyProjectRequest,
  ProjectApplicationReceipt
} from '../types/project'
import type { MyProjectSummaryResponse, ProjectSummaryResponse } from '../types/project-editor'
import { MasterService } from './master.service'
import { ApplicationService } from './application.service'

export const ProjectService = {
  async getProjectSummaries(query: { page: number; limit: number; q?: string }) {
    const { $api } = useApi()
    return await $api<ApiPaginatedResponse<ProjectSummaryResponse>>(
      API_ENDPOINTS.PROJECT.LIST_OR_CREATE,
      { query }
    )
  },

  async getMyProjectSummaries(
    query: { page: number; limit: number }
  ) {
    const { $api } = useApi()
    return await $api<ApiPaginatedResponse<MyProjectSummaryResponse>>(
      API_ENDPOINTS.PROJECT.MY_PROJECTS,
      { query: { scope: 'all', ...query } }
    )
  },

  async getProjects(params: Record<string, any> = {}) {
    const { $api } = useApi()
    return await $api<ApiResponse<Project[]>>(API_ENDPOINTS.PROJECT.LIST_OR_CREATE, {
      query: params
    })
  },

  async getProjectById(id: string) {
    const { $api } = useApi()
    return await $api<ApiResponse<Project>>(API_ENDPOINTS.PROJECT.DETAIL_BY_ID(id))
  },

  async getProjectBySlug(slug: string) {
    const { $api } = useApi()
    return await $api<ApiResponse<Project>>(API_ENDPOINTS.PROJECT.DETAIL_BY_SLUG(slug))
  },

  async createProject(payload: CreateProjectPayload) {
    const { $api } = useApi()
    return await $api<ApiResponse<Project>>(API_ENDPOINTS.PROJECT.LIST_OR_CREATE, {
      method: 'POST',
      body: payload
    })
  },

  async updateProject(id: string, payload: Partial<CreateProjectPayload>) {
    const { $api } = useApi()
    return await $api<ApiResponse<null>>(API_ENDPOINTS.PROJECT.DETAIL_BY_ID(id), {
      method: 'PATCH',
      body: payload
    })
  },

  async updateProjectFull(id: string, payload: Partial<CreateProjectPayload>) {
    const { $api } = useApi()
    return await $api<ApiResponse<Project>>(API_ENDPOINTS.PROJECT.DETAIL_BY_ID(id), {
      method: 'PUT',
      body: payload
    })
  },

  async updateProjectStatus(id: string, status: string) {
    const { $api } = useApi()
    return await $api<ApiResponse<null>>(API_ENDPOINTS.PROJECT.STATUS(id), {
      method: 'PATCH',
      body: { status }
    })
  },

  async publishProject(id: string) {
    const { $api } = useApi()
    return await $api<ApiResponse<null>>(API_ENDPOINTS.PROJECT.PUBLISH(id), {
      method: 'POST'
    })
  },

  async startProject(id: string) {
    const { $api } = useApi()
    return await $api<ApiResponse<null>>(API_ENDPOINTS.PROJECT.START(id), {
      method: 'POST'
    })
  },

  async getMyProjects() {
    const { $api } = useApi()
    return await $api<ApiResponse<Project[]>>(API_ENDPOINTS.PROJECT.MY_PROJECTS)
  },

  async applyToProject(projectId: string, payload: ApplyProjectRequest) {
    const { $api } = useApi()
    return await $api<ApiResponse<ProjectApplicationReceipt>>(API_ENDPOINTS.PROJECT.APPLY(projectId), {
      method: 'POST',
      body: payload
    })
  },

  async getProjectApplicants(projectId: string) {
    const { $api } = useApi()
    return await $api<ApiResponse<any[]>>(API_ENDPOINTS.PROJECT.APPLICANTS(projectId))
  },

  /**
   * Complete project - uses backend status update
   */
  async completeProject(id: string) {
    return await this.updateProjectStatus(id, 'completed')
  },

  /**
   * Archive project - uses backend status update
   */
  async archiveProject(id: string) {
    return await this.updateProjectStatus(id, 'archived')
  },

  // --- Member Management (Guards for unimplemented backend routes) ---

  async leaveProject(projectId: string) {
    console.warn(
      `[ProjectService] leaveProject for ${projectId}: Endpoint /projects/:id/members/leave belum didukung backend Go.`
    )
    const { $api } = useApi()
    return await $api<ApiResponse<null>>(`/projects/${projectId}/members/leave`, {
      method: 'POST'
    })
  },

  async updateMemberStatus(
    projectId: string,
    memberId: string,
    status: 'active' | 'removed'
  ) {
    console.warn(
      `[ProjectService] updateMemberStatus for member ${memberId}: Endpoint /projects/:id/members/:memberId/status belum didukung backend Go.`
    )
    const { $api } = useApi()
    return await $api<ApiResponse<null>>(
      `/projects/${projectId}/members/${memberId}/status`,
      {
        method: 'PATCH',
        body: { status }
      }
    )
  },

  async changeMemberRole(
    projectId: string,
    memberId: string,
    projectRoleId: string
  ) {
    console.warn(
      `[ProjectService] changeMemberRole for member ${memberId}: Endpoint /projects/:id/members/:memberId/role belum didukung backend Go.`
    )
    const { $api } = useApi()
    return await $api<ApiResponse<null>>(
      `/projects/${projectId}/members/${memberId}/role`,
      {
        method: 'PATCH',
        body: { project_role_id: projectRoleId }
      }
    )
  },

  // Delegated to MasterService (eliminated duplication)
  getSkills: MasterService.getSkills,
  getTools: MasterService.getTools,

  // Delegated to ApplicationService (separated domain)
  getMyApplications: ApplicationService.getMyApplications,
  reviewApplication: ApplicationService.reviewApplication,
  withdrawApplication: ApplicationService.withdrawApplication
}
