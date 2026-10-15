import { getApiErrorMessage } from '../utils/error'
import { useApi } from '../composables/useApi'
import { API_ENDPOINTS } from '../constants/api-endpoints'
import type { ApiResponse } from '../types/api'
import type {
  ActivityLog,
  CreateTaskPayload,
  MemberProfile,
  ReorderTaskUpdate,
  Task,
  TaskComment,
  UpdateTaskPayload,
  ContributionSnapshot,
  DeliverablePayload,
  FinalizationStatus,
  ProjectDeliverable,
  UpdateDeliverablePayload
} from '../types/workspace'
import type { WorkHistory } from '../types/project'
import type { WorkspaceProjectInfoDTO } from '../types/workspace-info'

export const WorkspaceService = {
  async getProjectInfo(projectSlug: string, signal?: AbortSignal): Promise<WorkspaceProjectInfoDTO> {
    const { $api } = useApi()
    const response = await $api<ApiResponse<WorkspaceProjectInfoDTO>>(
      API_ENDPOINTS.WORKSPACE.INFO(projectSlug),
      { signal }
    )
    if (!response.data) throw new Error(getApiErrorMessage(response, 'Informasi proyek belum dapat dimuat.'))
    return response.data
  },

  async startProject(projectId: string, request: { version: number; confirm_underfilled_positions: boolean }) {
    const { $api } = useApi()
    const response = await $api<ApiResponse<unknown>>(API_ENDPOINTS.PROJECT.STATUS(projectId), {
      method: 'PATCH',
      body: { ...request, status: 'in_progress' }
    })
    if (!response.data) throw new Error(getApiErrorMessage(response, 'Proyek belum dapat dimulai.'))
  },

  async getTasks(projectId: string): Promise<Task[]> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<Task[]>>(
      API_ENDPOINTS.WORKSPACE.TASKS(projectId)
    )
    return res.data ?? []
  },

  async createTask(
    payload: CreateTaskPayload & { created_by: string }
  ): Promise<Task> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<Task>>(
      API_ENDPOINTS.WORKSPACE.TASKS(payload.project_id),
      {
        method: 'POST',
        body: payload
      }
    )
    if (!res.data) throw new Error(getApiErrorMessage(res, 'Task tidak ditemukan.'))
    return res.data
  },

  async updateTask(taskId: string, payload: UpdateTaskPayload): Promise<Task> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<Task>>(
      API_ENDPOINTS.WORKSPACE.TASK_DETAIL(taskId),
      {
        method: 'PATCH',
        body: payload
      }
    )
    if (!res.data) throw new Error(getApiErrorMessage(res, 'Task tidak ditemukan.'))
    return res.data
  },

  async deleteTask(taskId: string): Promise<void> {
    const { $api } = useApi()
    await $api<ApiResponse<null>>(API_ENDPOINTS.WORKSPACE.TASK_DETAIL(taskId), {
      method: 'DELETE'
    })
  },

  async reorderTasks(updates: ReorderTaskUpdate[]): Promise<void> {
    const { $api } = useApi()
    await $api<ApiResponse<null>>(API_ENDPOINTS.WORKSPACE.TASKS_REORDER, {
      method: 'PATCH',
      body: { updates }
    })
  },

  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<TaskComment[]>>(
      API_ENDPOINTS.WORKSPACE.TASK_COMMENTS(taskId)
    )
    return res.data ?? []
  },

  async addComment(
    taskId: string,
    authorId: string,
    body: string
  ): Promise<TaskComment> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<TaskComment>>(
      API_ENDPOINTS.WORKSPACE.TASK_COMMENTS(taskId),
      {
        method: 'POST',
        body: { body }
      }
    )
    if (!res.data) throw new Error(getApiErrorMessage(res, 'Komentar tidak ditemukan.'))
    return res.data
  },

  async deleteComment(commentId: string): Promise<void> {
    const { $api } = useApi()
    await $api<ApiResponse<null>>(API_ENDPOINTS.WORKSPACE.COMMENT_DETAIL(commentId), {
      method: 'DELETE'
    })
  },

  async updateComment(commentId: string, body: string): Promise<TaskComment> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<TaskComment>>(
      API_ENDPOINTS.WORKSPACE.COMMENT_DETAIL(commentId),
      {
        method: 'PATCH',
        body: { body }
      }
    )
    if (!res.data) throw new Error(getApiErrorMessage(res, 'Komentar tidak ditemukan.'))
    return res.data
  },

  async getActivityLogs(projectId: string, limit = 20): Promise<ActivityLog[]> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<ActivityLog[]>>(
      API_ENDPOINTS.WORKSPACE.ACTIVITIES(projectId),
      {
        query: { limit }
      }
    )
    return res.data ?? []
  },

  async getWorkspaceMembers(
    projectId: string,
    creatorId?: string
  ): Promise<MemberProfile[]> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<MemberProfile[]>>(
      API_ENDPOINTS.WORKSPACE.MEMBERS(projectId)
    )
    return res.data ?? []
  },

  async getMyWorkHistory(projectId: string): Promise<WorkHistory> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<WorkHistory>>(
      API_ENDPOINTS.WORKSPACE.MY_HISTORY(projectId)
    )
    return res.data ?? { activities: [], my_tasks: [] }
  },

  // --- Evidence & Deliverables ---

  async getDeliverables(projectId: string): Promise<ProjectDeliverable[]> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<ProjectDeliverable[]>>(
      API_ENDPOINTS.EVIDENCE.DELIVERABLES(projectId)
    )
    return res.data ?? []
  },

  async createDeliverable(
    projectId: string,
    payload: DeliverablePayload
  ): Promise<ProjectDeliverable> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<ProjectDeliverable>>(
      API_ENDPOINTS.EVIDENCE.DELIVERABLES(projectId),
      {
        method: 'POST',
        body: payload
      }
    )
    if (!res.data) throw new Error(getApiErrorMessage(res, 'Deliverable tidak ditemukan.'))
    return res.data
  },

  async updateDeliverable(
    projectId: string,
    deliverableId: string,
    payload: UpdateDeliverablePayload
  ): Promise<ProjectDeliverable> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<ProjectDeliverable>>(
      API_ENDPOINTS.EVIDENCE.DELIVERABLE_DETAIL(projectId, deliverableId),
      {
        method: 'PATCH',
        body: payload
      }
    )
    if (!res.data) throw new Error(getApiErrorMessage(res, 'Deliverable tidak ditemukan.'))
    return res.data
  },

  async deleteDeliverable(
    projectId: string,
    deliverableId: string
  ): Promise<void> {
    const { $api } = useApi()
    await $api<ApiResponse<null>>(
      API_ENDPOINTS.EVIDENCE.DELIVERABLE_DETAIL(projectId, deliverableId),
      {
        method: 'DELETE'
      }
    )
  },

  async getContributionSnapshots(
    projectId: string
  ): Promise<ContributionSnapshot[]> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<ContributionSnapshot[]>>(
      API_ENDPOINTS.EVIDENCE.SNAPSHOTS(projectId)
    )
    return res.data ?? []
  },

  async getFinalizationStatus(projectId: string): Promise<FinalizationStatus> {
    const { $api } = useApi()
    const res = await $api<ApiResponse<FinalizationStatus>>(
      API_ENDPOINTS.EVIDENCE.FINALIZATION_STATUS(projectId)
    )
    return res.data ?? { project_id: projectId, status: 'succeeded', attempts: 0 }
  }
}
