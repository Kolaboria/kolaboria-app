import { onMounted, onScopeDispose, ref, watch, type Ref } from 'vue'
import { ProjectService } from '../services/project.service'
import type { MyProjectSummaryResponse } from '../types/project-editor'

// Publish the first batch while subsequent API pages load in the background.
// Keep the full collection so existing filters, sorting, and counts still work.
export const useMyProjectList = (accountId: Ref<string | null>) => {
  const projects = ref<MyProjectSummaryResponse[]>([])
  const pending = ref(true)
  const loadingMore = ref(false)
  const error = ref<unknown>(null)
  const loadMoreError = ref<unknown>(null)
  let sequence = 0

  const refresh = async () => {
    const requestSequence = ++sequence
    const requestAccount = accountId.value
    pending.value = Boolean(requestAccount)
    loadingMore.value = false
    error.value = null
    loadMoreError.value = null
    if (!requestAccount) {
      projects.value = []
      return
    }

    let page = 1
    let hasNextPage = true
    try {
      while (hasNextPage) {
        const response = await ProjectService.getMyProjectSummaries({ page, limit: 100 })
        if (requestSequence !== sequence || requestAccount !== accountId.value) return

        projects.value = page === 1
          ? [...response.data]
          : [...projects.value, ...response.data]
        pending.value = false
        hasNextPage = page < (response.meta?.total_pages ?? page)
        loadingMore.value = hasNextPage
        page++
      }
    } catch (failure: unknown) {
      if (requestSequence !== sequence || requestAccount !== accountId.value) return
      if (page === 1) error.value = failure
      else loadMoreError.value = failure
    } finally {
      if (requestSequence === sequence) {
        pending.value = false
        loadingMore.value = false
      }
    }
  }

  onMounted(() => { void refresh() })
  watch(accountId, () => {
    projects.value = []
    void refresh()
  })
  onScopeDispose(() => { sequence++ })

  return { projects, pending, loadingMore, error, loadMoreError, refresh }
}
