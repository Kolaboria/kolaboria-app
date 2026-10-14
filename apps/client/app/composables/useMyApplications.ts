import { computed, onMounted, onScopeDispose, ref, watch, type Ref } from 'vue'
import { getApiErrorStatus } from '../utils/error'
import type {
  ApplicationDetailResponse,
  ApplicationListQuery,
  MyApplicationGateway,
  MyApplicationListItemResponse,
  MyApplicationSummaryResponse
} from '../types/application'
import { useApplicationRefresh } from './useApplicationRefresh'

export const useMyApplications = (
  accountId: Ref<string | null>,
  query: Ref<ApplicationListQuery>,
  gateway: MyApplicationGateway
) => {
  const summary = ref<MyApplicationSummaryResponse | null>(null)
  const items = ref<MyApplicationListItemResponse[]>([])
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
  let sequence = 0
  let detailSequence = 0
  let controller: AbortController | null = null
  let detailController: AbortController | null = null
  let lastQueryKey = JSON.stringify(query.value)
  const hasMore = computed(() => Boolean(meta.value && currentPage.value < meta.value.total_pages))

  const refresh = async () => {
    const actor = accountId.value
    const request = ++sequence
    controller?.abort(); controller = new AbortController()
    if (!actor) { items.value = []; summary.value = null; meta.value = null; pending.value = false; return }
    pending.value = true; error.value = null; loadMoreError.value = null; currentPage.value = 1
    try {
      const [summaryResponse, listResponse] = await Promise.all([
        gateway.getMyApplicationSummary(controller.signal),
        gateway.getMyApplications({ ...query.value, page: 1, limit: 6 }, controller.signal)
      ])
      if (request !== sequence || actor !== accountId.value) return
      summary.value = summaryResponse.data ?? null
      items.value = listResponse.data ?? []
      meta.value = listResponse.meta
    } catch (failure) {
      if (request === sequence && actor === accountId.value && !(failure instanceof DOMException && failure.name === 'AbortError')) error.value = failure
    } finally { if (request === sequence) pending.value = false }
  }

  const loadPage = async (page: number, append = false) => {
    const actor = accountId.value
    if (!actor || page < 1 || loadingMore.value) return
    const request = ++sequence
    controller?.abort(); controller = new AbortController()
    if (append) { loadingMore.value = true; loadMoreError.value = null } else { pending.value = true; error.value = null }
    try {
      const response = await gateway.getMyApplications({
        ...query.value,
        page,
        limit: 6
      }, controller.signal)
      if (request !== sequence || actor !== accountId.value) return
      const rows = response.data ?? []
      if (append) {
        const known = new Set(items.value.map((item) => item.id))
        items.value = [...items.value, ...rows.filter((item) => !known.has(item.id))]
      } else items.value = rows
      meta.value = response.meta
      currentPage.value = page
    } catch (failure) {
      if (request === sequence && actor === accountId.value && !(failure instanceof DOMException && failure.name === 'AbortError')) {
        if (append) loadMoreError.value = failure; else error.value = failure
      }
    } finally { if (request === sequence) { pending.value = false; loadingMore.value = false } }
  }

  const openDetail = async (id: string) => {
    const actor = accountId.value
    const request = ++detailSequence
    detailController?.abort(); detailController = new AbortController()
    detail.value = null; detailError.value = null; detailPending.value = Boolean(actor)
    if (!actor) return
    try {
      const response = await gateway.getApplicationDetail(id, detailController.signal)
      if (request === detailSequence && actor === accountId.value) detail.value = response.data ?? null
    } catch (failure) { if (request === detailSequence && actor === accountId.value) detailError.value = failure }
    finally { if (request === detailSequence) detailPending.value = false }
  }

  const closeDetail = () => { detailSequence++; detailController?.abort(); detail.value = null; detailError.value = null; detailPending.value = false }

  const withdraw = async (id: string) => {
    const actor = accountId.value
    if (!actor || submitting.value) return null
    submitting.value = true
    try {
      const response = await gateway.withdrawApplication(id)
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

  watch(accountId, () => {
    sequence++; detailSequence++; controller?.abort(); detailController?.abort()
    items.value = []; summary.value = null; meta.value = null; detail.value = null
    if (accountId.value) void refresh()
  }, { flush: 'sync' })
  watch(query, () => {
    const queryKey = JSON.stringify(query.value)
    if (queryKey === lastQueryKey) return
    lastQueryKey = queryKey
    if (accountId.value) void loadPage(1)
  }, { deep: true })
  watch(revision, () => { if (accountId.value) void refresh() })
  onMounted(() => { if (accountId.value) void refresh() })
  onScopeDispose(() => { sequence++; detailSequence++; controller?.abort(); detailController?.abort() })

  return { summary, items, meta, pending, loadingMore, error, loadMoreError, detail, detailPending, detailError, submitting, currentPage, hasMore, refresh, loadPage, loadMore: () => hasMore.value ? loadPage(currentPage.value + 1, true) : Promise.resolve(), openDetail, closeDetail, withdraw }
}
