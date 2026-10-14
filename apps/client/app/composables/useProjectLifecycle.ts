import { onScopeDispose, ref, watch, type Ref } from 'vue'
import { useProjectLifecycleApi } from './useProjectLifecycleApi'
import { getApiErrorMessage, getApiErrorStatus } from '../utils/error'
import type { ProjectDetailResponse, ProjectLifecycleAction, ProjectLifecycleGateway, ProjectLifecycleTarget } from '../types/project-editor'

export const useProjectLifecycle = (options: {
  accountId: Ref<string | null>
  gateway?: ProjectLifecycleGateway
  onChanged: (action: ProjectLifecycleAction, detail: ProjectDetailResponse | null) => void | Promise<void>
  onConflict?: () => void | Promise<void>
}) => {
  const gateway = options.gateway ?? useProjectLifecycleApi()
  const target = ref<ProjectLifecycleTarget | null>(null)
  const action = ref<ProjectLifecycleAction>('draft')
  const pending = ref(false)
  const errorMessage = ref('')
  const conflict = ref(false)
  let sequence = 0

  const close = () => {
    if (pending.value) return
    sequence++
    target.value = null
    errorMessage.value = ''
    conflict.value = false
  }
  const request = (nextAction: ProjectLifecycleAction, project: ProjectLifecycleTarget) => {
    if (pending.value || !options.accountId.value) return
    sequence++
    action.value = nextAction
    target.value = { ...project }
    errorMessage.value = ''
    conflict.value = false
  }
  const confirm = async () => {
    const actor = options.accountId.value
    const project = target.value
    const selectedAction = action.value
    const mutationSequence = sequence
    if (!actor || !project || pending.value || conflict.value) return false
    pending.value = true
    errorMessage.value = ''
    let detail: ProjectDetailResponse | null = null
    try {
      if (selectedAction === 'delete') await gateway.deleteDraft(project.id, { version: project.version })
      else detail = await gateway.changeStatus(project.id, { version: project.version, status: selectedAction })
    } catch (error) {
      if (actor === options.accountId.value && mutationSequence === sequence) {
        conflict.value = getApiErrorStatus(error) === 409
        errorMessage.value = conflict.value
          ? selectedAction === 'draft'
            ? 'Proyek tidak dapat dikembalikan ke draft jika sudah memiliki riwayat lamaran atau kontributor. Gunakan arsip, atau muat ulang jika data proyek telah berubah.'
            : selectedAction === 'delete'
              ? 'Draft tidak dapat dihapus jika sudah berubah status atau memiliki riwayat lamaran atau kontributor. Tutup dialog dan muat ulang proyek.'
              : 'Data proyek telah berubah. Tutup dialog dan coba lagi dengan data terbaru.'
          : getApiErrorMessage(error, 'Perubahan proyek belum berhasil. Coba lagi.')
        if (conflict.value) await options.onConflict?.()
      }
      return false
    } finally { pending.value = false }
    if (actor !== options.accountId.value || mutationSequence !== sequence) return false
    target.value = null
    await options.onChanged(selectedAction, detail)
    return true
  }
  watch(options.accountId, () => {
    sequence++
    target.value = null
    errorMessage.value = ''
    conflict.value = false
  }, { flush: 'sync' })
  onScopeDispose(() => { sequence++ })
  return { target, action, pending, errorMessage, conflict, request, close, confirm }
}
