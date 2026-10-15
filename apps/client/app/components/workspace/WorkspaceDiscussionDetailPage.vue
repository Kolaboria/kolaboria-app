<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import WorkspaceDiscussionDetailView from './views/WorkspaceDiscussionDetailView.vue'
import { useWorkspaceDiscussions } from '~/composables/useWorkspaceDiscussions'
import { useWorkspaceProjectInfo } from '~/composables/useWorkspaceProjectInfo'
import { projectWorkspacePath } from '~/utils/workspace-paths'

const route = useRoute()
const projectSlug = computed(() => String(route.params.slug ?? ''))
const discussionId = computed(() => String(route.params.discussionId ?? ''))
const workspace = useWorkspaceDiscussions(() => projectSlug.value)
const projectInfo = useWorkspaceProjectInfo(projectSlug)
const canWrite = computed(() => projectInfo.data.value?.project.status === 'in_progress')
const {
  discussion,
  replies,
  detailPending,
  detailError,
  repliesPending,
  mutationPending,
  mutationError,
  hasMoreReplies,
  loadDiscussion,
  loadMoreReplies,
  updateDiscussion,
  deleteDiscussion,
  createReply,
  updateReply,
  deleteReply
} = workspace

const replyDraft = ref('')
const activeReplyId = ref<string | null | undefined>(undefined)
const backPath = computed(() => projectWorkspacePath(projectSlug.value, 'discussion'))

watch(
  [projectSlug, discussionId], ([slug, id]) => {
    replyDraft.value = ''
    activeReplyId.value = undefined
    if (slug && id) void loadDiscussion(id)
  },
  { immediate: true }
)

const submitReply = async (parentReplyId: string | null, body: string) => {
  const saved = await createReply({ body, parent_reply_id: parentReplyId })
  if (!saved) return
  replyDraft.value = ''
  activeReplyId.value = undefined
}

const submitDiscussionUpdate = async (title: string, body: string) => {
  await updateDiscussion({ title, body })
}

const removeDiscussion = async () => {
  if (await deleteDiscussion()) await navigateTo(backPath.value)
}

const removeReply = async (replyId: string) => {
  await deleteReply(replyId)
}
</script>

<template>
  <section class="space-y-4">
    <div v-if="detailPending" class="rounded-xl border border-neutral-200 bg-white px-5 py-10 text-center" role="status">
      <p class="font-body-2 text-neutral-500">Memuat diskusi…</p>
    </div>
    <section v-else-if="detailError" class="mx-auto max-w-xl rounded-xl border border-neutral-200 bg-white px-5 py-10 text-center" role="alert">
      <h1 class="font-title-2 text-secondary-900">Diskusi belum dapat dimuat</h1>
      <p class="mt-2 font-body-2 text-neutral-500">{{ detailError }}</p>
      <div class="mt-5 flex justify-center gap-2">
        <AtomicButton variant="outline" size="sm" @click="navigateTo(backPath)">Kembali</AtomicButton>
        <AtomicButton variant="primary" size="sm" @click="loadDiscussion(discussionId)">Coba lagi</AtomicButton>
      </div>
    </section>
    <WorkspaceDiscussionDetailView
      v-else-if="discussion"
      :discussion="discussion"
      :replies="replies"
      :detail-pending="detailPending"
      :replies-pending="repliesPending"
      :mutation-pending="mutationPending"
      :mutation-error="mutationError"
      :has-more-replies="hasMoreReplies"
      :can-write="canWrite"
      :write-status-known="!!projectInfo.data.value"
      :reply-draft="replyDraft"
      :active-reply-id="activeReplyId"
      @back="navigateTo(backPath)"
      @retry="loadDiscussion(discussionId)"
      @reply-draft-update="replyDraft = $event"
      @reply-select="activeReplyId = $event"
      @reply-submit="submitReply"
      @reply-load-more="loadMoreReplies"
      @discussion-update="submitDiscussionUpdate"
      @discussion-delete="removeDiscussion"
      @reply-update="updateReply"
      @reply-delete="removeReply"
    />
    <section v-else class="mx-auto max-w-xl rounded-xl border border-neutral-200 bg-white px-5 py-10 text-center">
      <h1 class="font-title-2 text-secondary-900">Diskusi tidak ditemukan</h1>
      <p class="mt-2 font-body-2 text-neutral-500">Topik ini mungkin sudah tidak tersedia di proyek tersebut.</p>
      <NuxtLink :to="backPath" class="mt-5 inline-flex min-h-10 items-center rounded-lg border border-neutral-200 px-4 font-label-3 text-primary-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
        Kembali ke diskusi
      </NuxtLink>
    </section>
  </section>
</template>
