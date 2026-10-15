import { API_ENDPOINTS } from '../constants/api-endpoints'
import { getApiErrorMessage } from '../utils/error'
import { useApi } from '../composables/useApi'
import type { ApiPaginatedResponse, ApiResponse } from '../types/api'
import {
  mapWorkspaceDiscussion,
  mapWorkspaceDiscussionListItem,
  mapWorkspaceDiscussionReply,
  type CreateWorkspaceDiscussionInput,
  type CreateWorkspaceDiscussionReplyInput,
  type UpdateWorkspaceDiscussionInput,
  type WorkspaceDiscussionDTO,
  type WorkspaceDiscussionListItemDTO,
  type WorkspaceDiscussionPage,
  type WorkspaceDiscussionReplyDTO,
  type WorkspaceDiscussionViewModel,
  type WorkspaceDiscussionListViewModel,
  type WorkspaceDiscussionReplyViewModel
} from '../types/workspace-discussion'

interface DiscussionRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  query?: Record<string, string | number>
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

export type WorkspaceDiscussionApiClient = <T = unknown>(
  request: string,
  options?: DiscussionRequestOptions
) => Promise<ApiResponse<T>>

const requireData = <T>(response: ApiResponse<T>, fallback: string): T => {
  if (response.data === undefined || response.data === null) {
    throw new Error(getApiErrorMessage(response, fallback))
  }
  return response.data
}

export const createDiscussionIdempotencyKey = (): string => {
  const key = globalThis.crypto?.randomUUID?.()
  if (!key) throw new Error('Browser tidak mendukung kunci pengiriman aman. Muat ulang halaman lalu coba lagi.')
  return key
}

export const createWorkspaceDiscussionService = (api: WorkspaceDiscussionApiClient) => ({
  async list(projectSlug: string, query: { page: number; limit: number } = { page: 1, limit: 20 }, signal?: AbortSignal): Promise<WorkspaceDiscussionPage<WorkspaceDiscussionListViewModel>> {
    const response = await api<WorkspaceDiscussionListItemDTO[]>(API_ENDPOINTS.WORKSPACE.DISCUSSIONS(projectSlug), { query, signal }) as ApiPaginatedResponse<WorkspaceDiscussionListItemDTO>
    const items = requireData(response, 'Diskusi proyek belum dapat dimuat.')
    if (!Array.isArray(items)) throw new Error('Respons daftar diskusi tidak valid.')
    const meta = response.meta
    if (!meta) throw new Error('Metadata pagination diskusi tidak tersedia.')
    return {
      items: items.map(mapWorkspaceDiscussionListItem),
      page: meta.page,
      limit: meta.limit,
      total: meta.total,
      totalPages: meta.total_pages
    }
  },

  async get(projectSlug: string, discussionId: string, signal?: AbortSignal): Promise<WorkspaceDiscussionViewModel> {
    const response = await api<WorkspaceDiscussionDTO>(API_ENDPOINTS.WORKSPACE.DISCUSSION(projectSlug, discussionId), { signal })
    return mapWorkspaceDiscussion(requireData(response, 'Diskusi proyek belum dapat dimuat.'))
  },

  async create(projectSlug: string, input: CreateWorkspaceDiscussionInput, idempotencyKey = createDiscussionIdempotencyKey(), signal?: AbortSignal): Promise<WorkspaceDiscussionViewModel> {
    const response = await api<WorkspaceDiscussionDTO>(API_ENDPOINTS.WORKSPACE.DISCUSSIONS(projectSlug), {
      method: 'POST', body: { title: input.title, body: input.body }, headers: { 'Idempotency-Key': idempotencyKey }, signal
    })
    return mapWorkspaceDiscussion(requireData(response, 'Diskusi belum berhasil disimpan.'))
  },

  async update(projectSlug: string, discussionId: string, input: UpdateWorkspaceDiscussionInput, signal?: AbortSignal): Promise<WorkspaceDiscussionViewModel> {
    const response = await api<WorkspaceDiscussionDTO>(API_ENDPOINTS.WORKSPACE.DISCUSSION(projectSlug, discussionId), { method: 'PATCH', body: input, signal })
    return mapWorkspaceDiscussion(requireData(response, 'Perubahan diskusi belum berhasil disimpan.'))
  },

  async delete(projectSlug: string, discussionId: string, signal?: AbortSignal): Promise<void> {
    await api<null>(API_ENDPOINTS.WORKSPACE.DISCUSSION(projectSlug, discussionId), { method: 'DELETE', signal })
  },

  async listReplies(projectSlug: string, discussionId: string, query: { page: number; limit: number } = { page: 1, limit: 20 }, signal?: AbortSignal): Promise<WorkspaceDiscussionPage<WorkspaceDiscussionReplyViewModel>> {
    const response = await api<WorkspaceDiscussionReplyDTO[]>(API_ENDPOINTS.WORKSPACE.DISCUSSION_REPLIES(projectSlug, discussionId), { query, signal }) as ApiPaginatedResponse<WorkspaceDiscussionReplyDTO>
    const items = requireData(response, 'Tanggapan diskusi belum dapat dimuat.')
    if (!Array.isArray(items)) throw new Error('Respons tanggapan diskusi tidak valid.')
    const meta = response.meta
    if (!meta) throw new Error('Metadata pagination tanggapan tidak tersedia.')
    return {
      items: items.map(mapWorkspaceDiscussionReply),
      page: meta.page,
      limit: meta.limit,
      total: meta.total,
      totalPages: meta.total_pages
    }
  },

  async createReply(projectSlug: string, discussionId: string, input: CreateWorkspaceDiscussionReplyInput, idempotencyKey = createDiscussionIdempotencyKey(), signal?: AbortSignal): Promise<WorkspaceDiscussionReplyViewModel> {
    const response = await api<WorkspaceDiscussionReplyDTO>(API_ENDPOINTS.WORKSPACE.DISCUSSION_REPLIES(projectSlug, discussionId), {
      method: 'POST', body: input, headers: { 'Idempotency-Key': idempotencyKey }, signal
    })
    return mapWorkspaceDiscussionReply(requireData(response, 'Balasan belum berhasil disimpan.'))
  },

  async updateReply(projectSlug: string, discussionId: string, replyId: string, body: string, signal?: AbortSignal): Promise<WorkspaceDiscussionReplyViewModel> {
    const response = await api<WorkspaceDiscussionReplyDTO>(API_ENDPOINTS.WORKSPACE.DISCUSSION_REPLY(projectSlug, discussionId, replyId), { method: 'PATCH', body: { body }, signal })
    return mapWorkspaceDiscussionReply(requireData(response, 'Perubahan balasan belum berhasil disimpan.'))
  },

  async deleteReply(projectSlug: string, discussionId: string, replyId: string, signal?: AbortSignal): Promise<void> {
    await api<null>(API_ENDPOINTS.WORKSPACE.DISCUSSION_REPLY(projectSlug, discussionId, replyId), { method: 'DELETE', signal })
  }
})

export const useWorkspaceDiscussionService = () => {
  const { $api } = useApi()
  return createWorkspaceDiscussionService($api as WorkspaceDiscussionApiClient)
}
