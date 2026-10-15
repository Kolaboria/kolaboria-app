import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { getApiErrorMessage } from '../utils/error'
import {
  createDiscussionIdempotencyKey,
  useWorkspaceDiscussionService
} from '../services/workspace-discussion.service'
import {
  clearDiscussionMutationKey,
  stableDiscussionMutationKey
} from '../utils/workspace-discussion-state'
import type {
  CreateWorkspaceDiscussionInput,
  CreateWorkspaceDiscussionReplyInput,
  UpdateWorkspaceDiscussionInput,
  WorkspaceDiscussionPage,
  WorkspaceDiscussionListViewModel,
  WorkspaceDiscussionReplyViewModel,
  WorkspaceDiscussionViewModel
} from '../types/workspace-discussion'

const emptyDiscussionPage = (): WorkspaceDiscussionPage<WorkspaceDiscussionListViewModel> => ({
  items: [], page: 1, limit: 20, total: 0, totalPages: 0
})

const emptyReplyPagination = () => ({ page: 1, limit: 20, total: 0, totalPages: 0 })

const findReply = (replies: WorkspaceDiscussionReplyViewModel[], id: string): WorkspaceDiscussionReplyViewModel | null => {
  for (const reply of replies) {
    if (reply.id === id) return reply
    const nested = findReply(reply.replies, id)
    if (nested) return nested
  }
  return null
}

export const useWorkspaceDiscussions = (projectSlug: MaybeRefOrGetter<string>) => {
  const slug = computed(() => toValue(projectSlug).trim())
  const service = useWorkspaceDiscussionService()
  const pendingIdempotencyKeys = new Map<string, { fingerprint: string; key: string }>()
  const listKey = computed(() => `workspace-discussions:${slug.value || 'missing-project'}`)
  const {
    data: discussionPage,
    pending: listPending,
    error: listError,
    refresh: refreshList
  } = useAsyncData<WorkspaceDiscussionPage<WorkspaceDiscussionListViewModel>>(
    listKey,
    () => service.list(slug.value),
    { watch: [slug], default: emptyDiscussionPage, dedupe: 'cancel' }
  )

  const discussion = ref<WorkspaceDiscussionViewModel | null>(null)
  const replies = ref<WorkspaceDiscussionReplyViewModel[]>([])
  const detailPending = ref(false)
  const detailError = ref('')
  const mutationPending = ref(false)
  const mutationError = ref('')
  const replyPagination = ref(emptyReplyPagination())
  const hasMoreReplies = computed(() => replyPagination.value.page < replyPagination.value.totalPages)
  const repliesPending = ref(false)
  const moreListPending = ref(false)
  const activeDiscussionId = ref<string | null>(null)
  let detailRequestSequence = 0

  const listErrorMessage = computed(() => listError.value
    ? getApiErrorMessage(listError.value, 'Daftar diskusi belum dapat dimuat.')
    : '')

  const loadDiscussion = async (discussionId: string): Promise<void> => {
    const sequence = ++detailRequestSequence
    const requestSlug = slug.value
    activeDiscussionId.value = discussionId
    detailPending.value = true
    detailError.value = ''
    discussion.value = null
    replies.value = []
    replyPagination.value = emptyReplyPagination()
    try {
      const [topic, page] = await Promise.all([
        service.get(requestSlug, discussionId),
        service.listReplies(requestSlug, discussionId, { page: 1, limit: 20 })
      ])
      if (sequence !== detailRequestSequence || requestSlug !== slug.value || discussionId !== activeDiscussionId.value) return
      discussion.value = topic
      replies.value = page.items
      replyPagination.value = { page: page.page, limit: page.limit, total: page.total, totalPages: page.totalPages }
    } catch (error) {
      if (sequence !== detailRequestSequence || requestSlug !== slug.value) return
      detailError.value = getApiErrorMessage(error, 'Diskusi belum dapat dimuat.')
    } finally {
      if (sequence === detailRequestSequence) detailPending.value = false
    }
  }

  const getDiscussionById = async (discussionId: string): Promise<WorkspaceDiscussionViewModel | null> => {
    try {
      return await service.get(slug.value, discussionId)
    } catch (error) {
      mutationError.value = getApiErrorMessage(error, 'Diskusi belum dapat dimuat.')
      return null
    }
  }

  const retryList = async (): Promise<void> => {
    await refreshList()
  }

  const loadMoreDiscussions = async (): Promise<void> => {
    const current = discussionPage.value
    if (moreListPending.value || current.page >= current.totalPages) return
    const requestSlug = slug.value
    const nextPage = current.page + 1
    moreListPending.value = true
    try {
      const next = await service.list(requestSlug, { page: nextPage, limit: current.limit })
      if (requestSlug !== slug.value || discussionPage.value.page !== current.page) return
      discussionPage.value = {
        ...next,
        items: [...current.items, ...next.items]
      }
    } catch (error) {
      mutationError.value = getApiErrorMessage(error, 'Diskusi berikutnya belum dapat dimuat.')
    } finally {
      moreListPending.value = false
    }
  }

  const createDiscussion = async (input: CreateWorkspaceDiscussionInput): Promise<boolean> => {
    mutationError.value = ''
    if (mutationPending.value || !slug.value) return false
    const scope = `topic:create:${slug.value}`
    const key = stableDiscussionMutationKey(pendingIdempotencyKeys, scope, input, createDiscussionIdempotencyKey)
    mutationPending.value = true
    try {
      await service.create(slug.value, input, key)
      clearDiscussionMutationKey(pendingIdempotencyKeys, scope)
      await refreshList()
      return true
    } catch (error) {
      mutationError.value = getApiErrorMessage(error, 'Diskusi belum berhasil disimpan.')
      return false
    } finally {
      mutationPending.value = false
    }
  }

  const updateDiscussion = async (input: UpdateWorkspaceDiscussionInput): Promise<boolean> => {
    const current = discussion.value
    if (!current?.canEdit || mutationPending.value) return false
    mutationError.value = ''
    mutationPending.value = true
    try {
      discussion.value = await service.update(slug.value, current.id, input)
      await refreshList()
      return true
    } catch (error) {
      mutationError.value = getApiErrorMessage(error, 'Perubahan diskusi belum berhasil disimpan.')
      return false
    } finally {
      mutationPending.value = false
    }
  }

  const updateDiscussionById = async (discussionId: string, input: UpdateWorkspaceDiscussionInput): Promise<boolean> => {
    const item = discussionPage.value.items.find((candidate) => candidate.id === discussionId)
    if (!item?.canEdit || mutationPending.value) return false
    mutationError.value = ''
    mutationPending.value = true
    try {
      await service.update(slug.value, discussionId, input)
      await refreshList()
      return true
    } catch (error) {
      mutationError.value = getApiErrorMessage(error, 'Perubahan diskusi belum berhasil disimpan.')
      return false
    } finally {
      mutationPending.value = false
    }
  }

  const deleteDiscussion = async (): Promise<boolean> => {
    const current = discussion.value
    if (!current?.canDelete || mutationPending.value) return false
    mutationError.value = ''
    mutationPending.value = true
    try {
      await service.delete(slug.value, current.id)
      discussion.value = null
      replies.value = []
      activeDiscussionId.value = null
      await refreshList()
      return true
    } catch (error) {
      mutationError.value = getApiErrorMessage(error, 'Diskusi belum dapat dihapus.')
      return false
    } finally {
      mutationPending.value = false
    }
  }

  const deleteDiscussionById = async (discussionId: string): Promise<boolean> => {
    const item = discussionPage.value.items.find((candidate) => candidate.id === discussionId)
    if (!item?.canDelete || mutationPending.value) return false
    mutationError.value = ''
    mutationPending.value = true
    try {
      await service.delete(slug.value, discussionId)
      await refreshList()
      return true
    } catch (error) {
      mutationError.value = getApiErrorMessage(error, 'Diskusi belum dapat dihapus.')
      return false
    } finally {
      mutationPending.value = false
    }
  }

  const loadMoreReplies = async (): Promise<void> => {
    const discussionId = activeDiscussionId.value
    const currentPage = replyPagination.value
    if (!discussionId || currentPage.page >= currentPage.totalPages || repliesPending.value) return
    const requestSlug = slug.value
    const nextPage = currentPage.page + 1
    repliesPending.value = true
    try {
      const next = await service.listReplies(requestSlug, discussionId, { page: nextPage, limit: currentPage.limit })
      if (requestSlug !== slug.value || discussionId !== activeDiscussionId.value || replyPagination.value.page !== currentPage.page) return
      const existingReplyIDs = new Set(replies.value.map((reply) => reply.id))
      replies.value = [...replies.value, ...next.items.filter((reply) => !existingReplyIDs.has(reply.id))]
      replyPagination.value = { page: next.page, limit: next.limit, total: next.total, totalPages: next.totalPages }
    } catch (error) {
      mutationError.value = getApiErrorMessage(error, 'Tanggapan berikutnya belum dapat dimuat.')
    } finally {
      repliesPending.value = false
    }
  }

  const createReply = async (input: CreateWorkspaceDiscussionReplyInput): Promise<boolean> => {
    const current = discussion.value
    if (!current || !activeDiscussionId.value || mutationPending.value) return false
    mutationError.value = ''
    const requestSlug = slug.value
    const parentID = input.parent_reply_id ?? null
    const scope = `reply:create:${requestSlug}:${current.id}:${parentID ?? 'root'}`
    const key = stableDiscussionMutationKey(pendingIdempotencyKeys, scope, input, createDiscussionIdempotencyKey)
    mutationPending.value = true
    try {
      const savedReply = await service.createReply(requestSlug, current.id, input, key)
      clearDiscussionMutationKey(pendingIdempotencyKeys, scope)

      const isCurrentDiscussion = () => requestSlug === slug.value &&
        activeDiscussionId.value === current.id && discussion.value?.id === current.id
      const activeDiscussion = discussion.value
      if (isCurrentDiscussion() && activeDiscussion?.id === current.id) {
        const alreadyVisible = findReply(replies.value, savedReply.id) !== null
        if (!alreadyVisible) {
          const savedParentID = savedReply.parentReplyId
          if (savedParentID) {
            const parent = findReply(replies.value, savedParentID)
            if (parent) parent.replies = [...parent.replies, savedReply]
          } else {
            replies.value = [...replies.value, savedReply]
            const total = replyPagination.value.total + 1
            replyPagination.value = {
              ...replyPagination.value,
              total,
              totalPages: Math.ceil(total / replyPagination.value.limit)
            }
          }
        }

        discussion.value = {
          ...activeDiscussion,
          replyCount: activeDiscussion.replyCount + (alreadyVisible ? 0 : 1),
          lastActivityAt: savedReply.createdAt,
          updatedAt: savedReply.updatedAt
        }
      }

      if (requestSlug === slug.value) {
        try {
          await refreshList()
          const summary = discussionPage.value.items.find((item) => item.id === current.id)
          const refreshedDiscussion = discussion.value
          if (summary && isCurrentDiscussion() && refreshedDiscussion?.id === current.id) {
            discussion.value = {
              ...refreshedDiscussion,
              replyCount: summary.replyCount,
              participantCount: summary.participantCount,
              lastActivityAt: summary.lastActivityAt,
              updatedAt: summary.updatedAt
            }
          }
        } catch {
          // The reply is already saved; keep its optimistic local state if summary refresh fails.
        }
      }
      return true
    } catch (error) {
      mutationError.value = getApiErrorMessage(error, 'Balasan belum berhasil disimpan.')
      return false
    } finally {
      mutationPending.value = false
    }
  }

  const updateReply = async (replyId: string, body: string): Promise<boolean> => {
    const current = discussion.value
    const reply = findReply(replies.value, replyId)
    if (!current || !reply?.canEdit || mutationPending.value) return false
    mutationError.value = ''
    mutationPending.value = true
    try {
      await service.updateReply(slug.value, current.id, replyId, body)
      await loadDiscussion(current.id)
      return true
    } catch (error) {
      mutationError.value = getApiErrorMessage(error, 'Perubahan balasan belum berhasil disimpan.')
      return false
    } finally {
      mutationPending.value = false
    }
  }

  const deleteReply = async (replyId: string): Promise<boolean> => {
    const current = discussion.value
    const reply = findReply(replies.value, replyId)
    if (!current || !reply?.canDelete || mutationPending.value) return false
    mutationError.value = ''
    mutationPending.value = true
    try {
      await service.deleteReply(slug.value, current.id, replyId)
      await loadDiscussion(current.id)
      await refreshList()
      return true
    } catch (error) {
      mutationError.value = getApiErrorMessage(error, 'Balasan belum dapat dihapus.')
      return false
    } finally {
      mutationPending.value = false
    }
  }

  const clearMutationError = () => {
    mutationError.value = ''
  }

  return {
    slug,
    discussionPage,
    discussion,
    replies,
    listPending,
    detailPending,
    repliesPending,
    moreListPending,
    mutationPending,
    listErrorMessage,
    detailError,
    mutationError,
    hasMoreReplies,
    retryList,
    loadMoreDiscussions,
    loadDiscussion,
    getDiscussionById,
    loadMoreReplies,
    createDiscussion,
    updateDiscussion,
    updateDiscussionById,
    deleteDiscussion,
    deleteDiscussionById,
    createReply,
    updateReply,
    deleteReply,
    clearMutationError
  }
}
