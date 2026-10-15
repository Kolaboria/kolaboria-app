import { computed, ref, watch, type Ref } from 'vue'
import { WorkspaceService } from '~/services/workspace.service'
import type { WorkspaceProjectInfoDTO, WorkspaceProjectInfoViewModel } from '~/types/workspace-info'
import { getApiErrorMessage, getApiErrorStatus } from '~/utils/error'
import { mapWorkspaceProjectInfo } from '~/utils/workspace-project-info'

export interface WorkspaceProjectInfoGateway {
  getInfo(slug: string, signal?: AbortSignal): Promise<WorkspaceProjectInfoDTO>
  startProject(projectId: string, request: { version: number; confirm_underfilled_positions: boolean }): Promise<void>
}

export const createWorkspaceProjectInfoController = (
  slug: Ref<string>,
  gateway: WorkspaceProjectInfoGateway
) => {
  const data = ref<WorkspaceProjectInfoViewModel | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const startError = ref<string | null>(null)
  const starting = ref(false)
  const confirmingStart = ref(false)
  let requestVersion = 0
  let activeRequest: AbortController | null = null

  const canStart = computed(() => !!data.value?.canStartProject && data.value.project.status === 'open')
  const hasUnderfilledPositions = computed(() => (data.value?.positionCapacitySummary.totalRemainingCapacity ?? 0) > 0)

  const load = async () => {
    const projectSlug = slug.value.trim()
    const currentRequest = ++requestVersion
    activeRequest?.abort()
    activeRequest = null
    data.value = null
    error.value = null
    if (!projectSlug) {
      loading.value = false
      error.value = 'Slug proyek tidak tersedia.'
      return
    }

    const controller = new AbortController()
    activeRequest = controller
    loading.value = true
    try {
      const response = await gateway.getInfo(projectSlug, controller.signal)
      if (currentRequest !== requestVersion || controller.signal.aborted) return
      data.value = mapWorkspaceProjectInfo(response)
    } catch (cause) {
      if (currentRequest !== requestVersion || controller.signal.aborted) return
      error.value = getApiErrorMessage(cause, 'Informasi proyek belum dapat dimuat.')
    } finally {
      if (currentRequest === requestVersion) {
        loading.value = false
        activeRequest = null
      }
    }
  }

  const requestStart = () => {
    if (!canStart.value || starting.value) return
    startError.value = null
    confirmingStart.value = true
  }

  const cancelStart = () => {
    if (!starting.value) confirmingStart.value = false
    startError.value = null
  }

  const confirmStart = async () => {
    const current = data.value
    if (!current || !canStart.value || starting.value) return
    starting.value = true
    startError.value = null
    try {
      await gateway.startProject(current.project.id, {
        version: current.project.version,
        confirm_underfilled_positions: current.positionCapacitySummary.totalRemainingCapacity > 0
      })
      confirmingStart.value = false
      await load()
    } catch (cause) {
      if (getApiErrorStatus(cause) === 409) {
        await load()
        if (!canStart.value) confirmingStart.value = false
        startError.value = 'Informasi proyek berubah. Periksa kuota terbaru sebelum melanjutkan.'
      } else {
        startError.value = getApiErrorMessage(cause, 'Proyek belum dapat dimulai.')
      }
    } finally {
      starting.value = false
    }
  }

  watch(slug, () => {
    confirmingStart.value = false
    startError.value = null
    void load()
  }, { immediate: true })

  return {
    data,
    loading,
    error,
    startError,
    starting,
    confirmingStart,
    canStart,
    hasUnderfilledPositions,
    load,
    requestStart,
    cancelStart,
    confirmStart
  }
}

export const useWorkspaceProjectInfo = (slug: Ref<string>) =>
  createWorkspaceProjectInfoController(slug, {
    getInfo: (projectSlug, signal) => WorkspaceService.getProjectInfo(projectSlug, signal),
    startProject: (projectId, request) => WorkspaceService.startProject(projectId, request)
  })
