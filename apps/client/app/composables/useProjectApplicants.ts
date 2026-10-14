import { computed, onMounted, onScopeDispose, ref, watch, type Ref } from 'vue'
import { getApiErrorStatus } from '../utils/error'
import type {
  ApplicantListItemResponse,
  ApplicantSummaryResponse,
  ApplicationDetailResponse,
  ApplicationListQuery,
  ApplicantGateway,
  ApplicationStatus
} from '../types/application'
import { useApplicationRefresh } from './useApplicationRefresh'

export const useProjectApplicants = (
  accountId: Ref<string | null>,
  projectId: Ref<string | null>,
  query: Ref<ApplicationListQuery>,
  gateway: ApplicantGateway
) => {
  const summary = ref<ApplicantSummaryResponse | null>(null)
  const items = ref<ApplicantListItemResponse[]>([])
  const meta = ref<{ page: number; limit: number; total: number; total_pages: number } | null>(null)
  const pending = ref(false)
  const loadingMore = ref(false)
  const error = ref<unknown>(null)
  const loadMoreError = ref<unknown>(null)
  const detail = ref<ApplicationDetailResponse | null>(null)
  const detailPending = ref(false)
  const detailError = ref<unknown>(null)
  const submitting = ref(false)
  const currentPage = ref(1)
  const { revision, notifyApplicationMutation } = useApplicationRefresh(accountId)
  let requestSequence = 0
  let detailSequence = 0
  let controller: AbortController | null = null
  let detailController: AbortController | null = null
  let lastQueryKey = JSON.stringify(query.value)

  const hasMore = computed(() => Boolean(meta.value && currentPage.value < meta.value.total_pages))

  const refresh = async () => {
    const actor = accountId.value
    const project = projectId.value
    const sequence = ++requestSequence
    controller?.abort()
    controller = new AbortController()
    if (!actor || !project) {
      summary.value = null; items.value = []; meta.value = null; pending.value = false
      return
    }
    pending.value = true
    error.value = null
    loadMoreError.value = null
    currentPage.value = 1
    try {
      const [summaryResponse, listResponse] = await Promise.all([
        gateway.getApplicantSummary(project, controller.signal),
        gateway.getProjectApplicants(project, { ...query.value, page: 1, limit: 5 }, controller.signal)
      ])
      if (sequence !== requestSequence || actor !== accountId.value || project !== projectId.value) return
      summary.value = summaryResponse.data ?? null
      items.value = listResponse.data ?? []
      meta.value = listResponse.meta
    } catch (failure) {
      if (sequence !== requestSequence || actor !== accountId.value || project !== projectId.value) return
      if (!(failure instanceof DOMException && failure.name === 'AbortError')) error.value = failure
    } finally {
      if (sequence === requestSequence) pending.value = false
    }
  }

  const loadPage = async (page: number, append = false) => {
    const actor = accountId.value
    const project = projectId.value
    if (!actor || !project || page < 1 || loadingMore.value) return
    const sequence = ++requestSequence
    controller?.abort()
    controller = new AbortController()
    if (append) { loadingMore.value = true; loadMoreError.value = null }
    else { pending.value = true; error.value = null }
    try {
      const response = await gateway.getProjectApplicants(project, {
        ...query.value,
        page,
        limit: 5
      }, controller.signal)
      if (sequence !== requestSequence || actor !== accountId.value || project !== projectId.value) return
      const rows = response.data ?? []
      if (append) {
        const known = new Set(items.value.map((item) => item.id))
        items.value = [...items.value, ...rows.filter((item) => !known.has(item.id))]
      } else items.value = rows
      meta.value = response.meta
      currentPage.value = page
    } catch (failure) {
      if (sequence !== requestSequence || actor !== accountId.value || project !== projectId.value) return
      if (!(failure instanceof DOMException && failure.name === 'AbortError')) {
        if (append) loadMoreError.value = failure
        else error.value = failure
      }
    } finally {
      if (sequence === requestSequence) { pending.value = false; loadingMore.value = false }
    }
  }

  const loadMore = () => hasMore.value ? loadPage(currentPage.value + 1, true) : Promise.resolve()

  const openDetail = async (id: string) => {
    const actor = accountId.value
    const sequence = ++detailSequence
    detailController?.abort()
    detailController = new AbortController()
    detail.value = null; detailError.value = null; detailPending.value = true
    if (!actor) { detailPending.value = false; return }
    try {
      const response = await gateway.getApplicationDetail(id, detailController.signal)
      if (sequence !== detailSequence || actor !== accountId.value) return
      detail.value = response.data ?? null
    } catch (failure) {
      if (sequence === detailSequence && actor === accountId.value) detailError.value = failure
    } finally {
      if (sequence === detailSequence) detailPending.value = false
    }
  }

  const closeDetail = () => { detailSequence++; detailController?.abort(); detail.value = null; detailError.value = null; detailPending.value = false }

  const review = async (status: 'accepted' | 'rejected', note: string) => {
    const actor = accountId.value
    const applicationId = detail.value?.id
    if (!actor || !applicationId || submitting.value) return null
    submitting.value = true
    try {
      const response = await gateway.reviewApplication(applicationId, { status, reviewer_note: note.trim() || null })
      if (actor !== accountId.value) return null
      detail.value = response.data ?? null
      notifyApplicationMutation(actor)
      await refresh()
      return detail.value
    } catch (failure) {
      if (getApiErrorStatus(failure) === 409 && actor === accountId.value) await refresh()
      throw failure
    } finally { submitting.value = false }
  }

  watch([accountId, projectId], () => {
    requestSequence++; detailSequence++; controller?.abort(); detailController?.abort()
    summary.value = null; items.value = []; meta.value = null; detail.value = null
    if (accountId.value && projectId.value) void refresh()
  }, { flush: 'sync' })
  watch(query, () => {
    const queryKey = JSON.stringify(query.value)
    if (queryKey === lastQueryKey) return
    lastQueryKey = queryKey
    if (accountId.value && projectId.value) void loadPage(1)
  }, { deep: true })
  watch(revision, () => { if (accountId.value && projectId.value) void refresh() })
  onMounted(() => { if (accountId.value && projectId.value) void refresh() })
  onScopeDispose(() => {
    requestSequence++; detailSequence++; controller?.abort(); detailController?.abort()
  })

  return { summary, items, meta, pending, loadingMore, error, loadMoreError, detail, detailPending, detailError, submitting, hasMore, refresh, loadPage, loadMore, openDetail, closeDetail, review }
}

export type ApplicantStatusFilter = ApplicationStatus[]
