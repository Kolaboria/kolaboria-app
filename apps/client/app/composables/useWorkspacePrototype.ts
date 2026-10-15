import { computed, onMounted, watch } from 'vue'
import {
  addTaskComment,
  canCloseProject as canCloseProjectState,
  closeProject as closeProjectState,
  closeTask as closeTaskState,
  createDiscussion as createDiscussionState,
  createTask as createTaskState,
  deleteTask as deleteTaskState,
  createWorkspacePrototypeState,
  migrateWorkspacePrototypeState,
  personFor,
  projectFor,
  proposeContributions as proposeContributionsState,
  replyDiscussion as replyDiscussionState,
  reviewContribution as reviewContributionState,
  setRoleReadiness as setRoleReadinessState,
  shareContribution as shareContributionState,
  setContributionSharing as setContributionSharingState,
  startProject as startProjectState,
  moveTask as moveTaskState,
  canManageTasks as canManageTasksState,
  isProjectManager as isProjectManagerState,
  setTaskManagerAccess as setTaskManagerAccessState,
  type WorkspacePrototypeContribution,
  type WorkspacePrototypeReadiness,
  type WorkspacePrototypeState,
  type WorkspacePrototypeTask,
  type WorkspacePrototypeTaskStatus
} from '~/utils/workspace-prototype-state'

const STORAGE_KEY = 'kolaboria-workspace-state-v2'
const LEGACY_STORAGE_KEY = 'kolaboria-workspace-prototype-v1'

const isWorkspacePrototypeState = (value: unknown): value is WorkspacePrototypeState => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<WorkspacePrototypeState>
  return Array.isArray(candidate.projects) && Array.isArray(candidate.people)
    && typeof candidate.activeProjectId === 'string'
    && typeof candidate.currentUserId === 'string'
}

export const useWorkspacePrototype = () => {
  const state = useState<WorkspacePrototypeState>('kolaboria-workspace-state-v2', () => createWorkspacePrototypeState())
  const notice = useState<string>('kolaboria-workspace-notice', () => '')
  const activeProject = computed(() => projectFor(state.value, state.value.activeProjectId))
  const currentUser = computed(() => personFor(state.value, state.value.currentUserId))
  const isOwner = computed(() => activeProject.value?.ownerId === state.value.currentUserId)
  const isProjectManager = computed(() => Boolean(activeProject.value && isProjectManagerState(activeProject.value, state.value.currentUserId)))
  const canManageTasks = computed(() => Boolean(activeProject.value && canManageTasksState(activeProject.value, state.value.currentUserId)))
  const taskGroups = computed<Record<WorkspacePrototypeTaskStatus, WorkspacePrototypeTask[]>>(() => ({
    todo: activeProject.value?.tasks.filter((task) => task.status === 'todo') ?? [],
    doing: activeProject.value?.tasks.filter((task) => task.status === 'doing') ?? [],
    review: activeProject.value?.tasks.filter((task) => task.status === 'review') ?? [],
    done: activeProject.value?.tasks.filter((task) => task.status === 'done') ?? [],
    closed: activeProject.value?.tasks.filter((task) => task.status === 'closed' || task.status === 'cancelled') ?? [],
    cancelled: activeProject.value?.tasks.filter((task) => task.status === 'cancelled') ?? []
  }))
  const activeTaskCount = computed(() => activeProject.value?.tasks.filter((task) => task.status !== 'closed' && task.status !== 'cancelled').length ?? 0)
  const completedTaskCount = computed(() => taskGroups.value.done.length)
  const progress = computed(() => activeTaskCount.value ? Math.round(completedTaskCount.value / activeTaskCount.value * 100) : 0)
  const reviewCount = computed(() => taskGroups.value.review.length)
  const canClose = computed(() => Boolean(activeProject.value && canCloseProjectState(activeProject.value)))
  let noticeTimer: ReturnType<typeof setTimeout> | undefined

  const persist = () => {
    if (import.meta.client) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  }

  onMounted(() => {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        if (isWorkspacePrototypeState(parsed) && parsed.projects.length > 0) {
          state.value = migrateWorkspacePrototypeState(parsed)
        } else {
          state.value = createWorkspacePrototypeState()
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
      state.value = createWorkspacePrototypeState()
    }
    // Write the seed on first visit so localStorage is the durable source after
    // initialization, then keep it in sync with subsequent Workspace changes.
    persist()
    watch(state, persist, { deep: true })
  })

  const notify = (message: string) => {
    notice.value = message
    if (noticeTimer) clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => { notice.value = '' }, 2800)
  }

  const switchProject = (projectId: string) => {
    if (!projectFor(state.value, projectId)) return
    state.value.activeProjectId = projectId
    const project = projectFor(state.value, projectId)
    if (project && !project.memberIds.includes(state.value.currentUserId)) {
      state.value.currentUserId = project.ownerId
    }
  }

  const switchPerson = (personId: string) => {
    if (!activeProject.value?.memberIds.includes(personId)) return false
    state.value.currentUserId = personId
    return true
  }

  const changeReadiness = (roleId: string, readiness: WorkspacePrototypeReadiness) => {
    const project = activeProject.value
    if (!project || !setRoleReadinessState(state.value, project.id, roleId, readiness, state.value.currentUserId)) return false
    notify('Kesiapan peran diperbarui.')
    return true
  }

  const startProject = () => {
    const project = activeProject.value
    if (!project || !startProjectState(state.value, project.id, state.value.currentUserId)) {
      notify('Tandai semua peran wajib siap atau tidak lagi dibutuhkan sebelum memulai.')
      return false
    }
    notify('Proyek dimulai. Tim sekarang dapat bekerja di Workspace.')
    return true
  }

  const moveTask = (taskId: string, status: Exclude<WorkspacePrototypeTaskStatus, 'cancelled' | 'closed'>) => {
    const project = activeProject.value
    if (!project || !moveTaskState(state.value, project.id, taskId, status, state.value.currentUserId)) {
      notify(isProjectManager.value ? 'Perubahan status tidak dapat disimpan.' : 'Kamu hanya dapat mengelola task milikmu dan mengirimnya untuk review.')
      return false
    }
    notify(status === 'review' ? 'Task dikirim ke owner untuk direview.' : 'Status task diperbarui.')
    return true
  }

  const closeTask = (taskId: string, reason: string) => {
    const project = activeProject.value
    if (!project || !closeTaskState(state.value, project.id, taskId, state.value.currentUserId, reason)) {
      notify('Task hanya dapat ditutup pemegang proyek dengan alasan perubahan scope.')
      return false
    }
    notify('Task ditutup dan alasan perubahan scope disimpan.')
    return true
  }

  const addTask = (input: Omit<WorkspacePrototypeTask, 'id' | 'comments' | 'status'> & { status?: Exclude<WorkspacePrototypeTaskStatus, 'closed' | 'cancelled'> }) => {
    const project = activeProject.value
    if (!project) return null
    const created = createTaskState(state.value, project.id, state.value.currentUserId, input)
    if (!created) {
      notify('Kamu belum memiliki izin membuat task atau judul masih kosong.')
      return null
    }
    notify('Task baru ditambahkan.')
    return created
  }

  const removeTask = (taskId: string) => {
    const project = activeProject.value
    if (!project || !deleteTaskState(state.value, project.id, taskId, state.value.currentUserId)) {
      notify('Task ini tidak dapat dihapus. Task selesai atau ditutup tetap menjadi bagian riwayat proyek.')
      return false
    }
    notify('Task dihapus dari proyek.')
    return true
  }

  const grantTaskManagement = (memberId: string, enabled: boolean) => {
    const project = activeProject.value
    if (!project || !setTaskManagerAccessState(state.value, project.id, state.value.currentUserId, memberId, enabled)) return false
    notify(enabled ? 'Izin membuat dan menghapus task diberikan.' : 'Izin task dicabut.')
    return true
  }

  const commentOnTask = (taskId: string, body: string) => {
    const project = activeProject.value
    if (!project || !addTaskComment(state.value, project.id, taskId, state.value.currentUserId, body)) {
      notify('Komentar tidak dapat dikirim. Pastikan pesan tidak kosong.')
      return false
    }
    notify('Komentar ditambahkan ke task.')
    return true
  }

  const startDiscussion = (title: string, body: string) => {
    const project = activeProject.value
    if (!project) return null
    const discussion = createDiscussionState(state.value, project.id, state.value.currentUserId, title, body)
    if (!discussion) {
      notify('Isi judul dan pesan diskusi terlebih dahulu.')
      return null
    }
    notify('Diskusi proyek dipublikasikan.')
    return discussion
  }

  const replyToDiscussion = (
    discussionId: string,
    body: string,
    parentReplyId: string | null = null,
  ) => {
    const project = activeProject.value
    if (!project || !replyDiscussionState(state.value, project.id, discussionId, state.value.currentUserId, body, parentReplyId)) {
      notify('Balasan tidak dapat dikirim. Pastikan pesan tidak kosong.')
      return false
    }
    notify('Balasan ditambahkan.')
    return true
  }

  const finishProject = (resultSummary: string) => {
    const project = activeProject.value
    if (!project || !closeProjectState(state.value, project.id, state.value.currentUserId, resultSummary)) {
      notify(canClose.value ? 'Tuliskan ringkasan hasil sebelum menutup proyek.' : 'Selesaikan atau tutup task dengan alasan sebelum meninjau hasil proyek.')
      return false
    }
    notify('Proyek ditutup setelah hasil ditinjau. Rekam kontribusi dapat diusulkan berikutnya.')
    return true
  }

  const proposeContributions = () => {
    const project = activeProject.value
    if (!project) return []
    const created: WorkspacePrototypeContribution[] = proposeContributionsState(state.value, project.id, state.value.currentUserId)
    notify(created.length ? 'Usulan rekam kontribusi dibuat dan masih privat.' : 'Tidak ada rekam baru untuk diusulkan.')
    return created
  }

  const reviewContribution = (contributionId: string, decision: 'accepted' | 'changes_requested', note = '') => {
    const project = activeProject.value
    if (!project || !reviewContributionState(state.value, project.id, contributionId, state.value.currentUserId, decision, note)) {
      notify(decision === 'changes_requested' ? 'Tuliskan bagian yang perlu dikoreksi.' : 'Kamu hanya dapat meninjau rekam kontribusimu sendiri.')
      return false
    }
    notify(decision === 'accepted' ? 'Rekam dikonfirmasi. Kamu yang menentukan apakah akan membagikannya.' : 'Permintaan koreksi dikirim. Rekam tetap privat.')
    return true
  }

  const shareContribution = (contributionId: string) => {
    const project = activeProject.value
    if (!project || !shareContributionState(state.value, project.id, contributionId, state.value.currentUserId)) {
      notify('Rekam hanya dapat dibagikan oleh pemiliknya setelah disetujui.')
      return false
    }
    notify('Rekam kontribusi sekarang dibagikan.')
    return true
  }

  const stopSharingContribution = (contributionId: string) => {
    const project = activeProject.value
    if (!project || !setContributionSharingState(state.value, project.id, contributionId, state.value.currentUserId, false)) {
      notify('Izin berbagi rekam ini tidak dapat diubah.')
      return false
    }
    notify('Rekam kembali privat.')
    return true
  }

  return {
    state, activeProject, currentUser, isOwner, isProjectManager, canManageTasks, taskGroups, activeTaskCount,
    completedTaskCount, progress, reviewCount, canClose, notice,
    switchProject, switchPerson, changeReadiness, startProject,
    moveTask, closeTask, addTask, removeTask, grantTaskManagement, commentOnTask, startDiscussion,
    replyToDiscussion, finishProject, proposeContributions,
    reviewContribution, shareContribution, stopSharingContribution
  }
}
