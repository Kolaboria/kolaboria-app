import { getApiErrorMessage } from '../utils/error'
import { ProjectService } from '../services/project.service'
import type {
  Project,
  CreateProjectPayload,
  ProjectFilters,
  ApplyProjectRequest
} from '../types/project'
import type { MyProjectSummaryResponse, ProjectSummaryResponse } from '../types/project-editor'
import type { ApiPaginatedResponse } from '../types/api'
import { toProjectDetailView } from '../utils/project-presentation'

const getAllSummaryPages = async <T>(
  loadPage: (page: number) => Promise<ApiPaginatedResponse<T>>
): Promise<T[]> => {
  const items: T[] = []
  let page = 1
  let totalPages = 1
  while (page <= totalPages) {
    const response = await loadPage(page)
    items.push(...response.data)
    totalPages = Math.max(page, response.meta?.total_pages ?? page)
    page += 1
  }
  return items
}

export const useProjects = () => {
  const getPublicProjectSummaries = async (): Promise<ProjectSummaryResponse[]> => {
    return getAllSummaryPages(page => ProjectService.getProjectSummaries({ page, limit: 100 }))
  }

  const getMyProjectSummaries = async (): Promise<MyProjectSummaryResponse[]> => {
    return getAllSummaryPages(page => ProjectService.getMyProjectSummaries({ page, limit: 100 }))
  }

  // ============================================================
  // Phase 1 — Listing & Detail
  // ============================================================

  const getProjects = async (
    filters: ProjectFilters = {}
  ): Promise<Project[]> => {
    try {
      const res = await ProjectService.getProjects(filters)
      const list = res.data ?? []
      return list.map((p: any) => ({
        ...p,
        profiles: p.creator
      }))
    } catch (err) {
      console.error('Failed to get projects:', err)
      return []
    }
  }

  const getProjectById = async (id: string): Promise<Project | null> => {
    try {
      const res = await ProjectService.getProjectById(id)
      if (!res.data) return null
      return {
        ...res.data,
        profiles: res.data.creator
      }
    } catch (err) {
      console.error(`Failed to get project by ID ${id}:`, err)
      return null
    }
  }

  const getProjectBySlug = async (slug: string): Promise<Project | null> => {
    try {
      const res = await ProjectService.getProjectBySlug(slug)
      if (!res.data) return null
      return toProjectDetailView(res.data)
    } catch (err) {
      console.error(`Failed to get project by slug ${slug}:`, err)
      return null
    }
  }

  const getRecentProjects = async (limit = 3): Promise<Project[]> => {
    return getProjects({ limit })
  }

  // ============================================================
  // Phase 2 — Create & Manage Project
  // ============================================================

  const createProject = async (
    payload: CreateProjectPayload
  ): Promise<Project> => {
    const res = await ProjectService.createProject(payload)
    if (!res.data) {
      throw new Error(getApiErrorMessage(res, 'Gagal membuat project.'))
    }
    return {
      ...res.data,
      profiles: res.data.creator
    }
  }

  const publishProject = async (projectId: string): Promise<void> => {
    const res = await ProjectService.publishProject(projectId)
    if (res.status >= 400) {
      throw new Error(getApiErrorMessage(res, 'Gagal mempublikasikan project.'))
    }
  }

  const updateProject = async (
    projectId: string,
    payload: Partial<CreateProjectPayload>
  ): Promise<void> => {
    const res = await ProjectService.updateProject(projectId, payload)
    if (res.status >= 400) {
      throw new Error(getApiErrorMessage(res, 'Gagal memperbarui project.'))
    }
  }

  const updateProjectFull = async (
    projectId: string,
    payload: Partial<CreateProjectPayload>
  ): Promise<Project> => {
    const res = await ProjectService.updateProjectFull(projectId, payload)
    if (res.status >= 400) {
      throw new Error(getApiErrorMessage(res, 'Gagal memperbarui project.'))
    }
    if (!res.data) {
      throw new Error(getApiErrorMessage(res, 'Project hasil perubahan tidak tersedia.'))
    }
    return {
      ...res.data,
      profiles: res.data.creator
    } as Project
  }

  const updateProjectStatus = async (
    projectId: string,
    status: 'open' | 'in_progress' | 'completed' | 'archived'
  ): Promise<void> => {
    const res = await ProjectService.updateProjectStatus(projectId, status)
    if (res.status >= 400) {
      throw new Error(getApiErrorMessage(res, 'Gagal memperbarui status project.'))
    }
  }

  const startProject = async (projectId: string): Promise<void> => {
    const res = await ProjectService.startProject(projectId)
    if (res.status >= 400) {
      throw new Error(getApiErrorMessage(res, 'Gagal memulai project.'))
    }
  }

  const completeProject = async (projectId: string) => {
    const res = await ProjectService.completeProject(projectId)
    if (res && res.status >= 400) throw new Error(getApiErrorMessage(res, 'Gagal menyelesaikan project.'))
    return res
  }

  const archiveProject = async (projectId: string): Promise<void> => {
    const res = await ProjectService.archiveProject(projectId)
    if (res && res.status >= 400) throw new Error(getApiErrorMessage(res, 'Gagal mengarsipkan project.'))
  }

  const getMyProjects = async (): Promise<Project[]> => {
    try {
      const res = await ProjectService.getMyProjects()
      const list = res.data ?? []
      return list.map((p: any) => ({
        ...p,
        profiles: p.creator
      }))
    } catch (err) {
      console.error('Failed to get my projects:', err)
      return []
    }
  }

  const applyToProject = async (
    projectId: string,
    request: ApplyProjectRequest
  ): Promise<void> => {
    const res = await ProjectService.applyToProject(projectId, request)
    if (res.status >= 400) {
      throw new Error(getApiErrorMessage(res, 'Gagal melamar ke project.'))
    }
  }

  const getSkills = async () => {
    try {
      const res = await ProjectService.getSkills()
      return Array.isArray(res) ? res : (res as any)?.data ?? []
    } catch (err) {
      console.error('Failed to get skills:', err)
      return []
    }
  }

  const leaveProject = async (projectId: string) => {
    const res = await ProjectService.leaveProject(projectId)
    if (res.status >= 400) throw new Error(getApiErrorMessage(res, 'Gagal keluar dari project.'))
  }

  const updateMemberStatus = async (projectId: string, memberId: string, status: 'active' | 'removed') => {
    const res = await ProjectService.updateMemberStatus(projectId, memberId, status)
    if (res.status >= 400) throw new Error(getApiErrorMessage(res, 'Gagal memperbarui status member.'))
  }

  const changeMemberRole = async (projectId: string, memberId: string, projectRoleId: string) => {
    const res = await ProjectService.changeMemberRole(projectId, memberId, projectRoleId)
    if (res.status >= 400) throw new Error(getApiErrorMessage(res, 'Gagal mengubah role member.'))
  }

  return {
    getPublicProjectSummaries,
    getMyProjectSummaries,
    getProjects,
    getProjectById,
    getProjectBySlug,
    getRecentProjects,
    createProject,
    publishProject,
    updateProject,
    updateProjectFull,
    updateProjectStatus,
    startProject,
    completeProject,
    archiveProject,
    getMyProjects,
    applyToProject,
    getSkills,
    leaveProject,
    updateMemberStatus,
    changeMemberRole
  }
}
