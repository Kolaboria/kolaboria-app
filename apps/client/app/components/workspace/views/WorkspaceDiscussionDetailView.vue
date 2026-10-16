<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { ArrowLeft, MessageCircle, Pencil, Trash2 } from '@lucide/vue'
import WorkspaceDiscussionReplyComposer from './WorkspaceDiscussionReplyComposer.vue'
import WorkspaceDiscussionReplyItem from './WorkspaceDiscussionReplyItem.vue'
import {
  formatWorkspaceDiscussionDate,
  workspaceDiscussionReplyParentId
} from '~/utils/workspace-discussion-presentation'
import type {
  WorkspaceDiscussionReplyViewModel,
  WorkspaceDiscussionViewModel
} from '~/types/workspace-discussion'

const props = defineProps<{
  discussion: WorkspaceDiscussionViewModel
  replies: WorkspaceDiscussionReplyViewModel[]
  detailPending: boolean
  repliesPending: boolean
  mutationPending: boolean
  mutationError: string
  hasMoreReplies: boolean
  canWrite: boolean
  writeStatusKnown: boolean
  replyDraft: string
  activeReplyId: string | null | undefined
}>()

const emit = defineEmits<{
  back: []
  retry: []
  'reply-draft-update': [value: string]
  'reply-select': [replyId: string | null | undefined]
  'reply-submit': [parentReplyId: string | null, body: string]
  'reply-load-more': []
  'discussion-update': [title: string, body: string]
  'discussion-delete': []
  'reply-update': [replyId: string, body: string]
  'reply-delete': [replyId: string]
}>()

const editDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editTitle = ref('')
const editBody = ref('')
const discussionTimeZone = ref('UTC')

onMounted(() => {
  discussionTimeZone.value = Intl.DateTimeFormat().resolvedOptions().timeZone
})

const formatDate = (value: string) => formatWorkspaceDiscussionDate(value, discussionTimeZone.value)

watch(() => props.discussion.id, () => {
  editDialogOpen.value = false
  deleteDialogOpen.value = false
})
watch(() => props.discussion.updatedAt, () => {
  if (editDialogOpen.value) editDialogOpen.value = false
})

const openEdit = () => {
  if (!props.discussion.canEdit) return
  editTitle.value = props.discussion.title
  editBody.value = props.discussion.body
  editDialogOpen.value = true
}

const submitEdit = () => {
  emit('discussion-update', editTitle.value, editBody.value)
}

const selectTopicReply = () => {
  emit('reply-select', props.activeReplyId === null ? undefined : null)
}

const submitTopicReply = () => {
  if (props.replyDraft.trim()) emit('reply-submit', null, props.replyDraft)
}

const selectReply = (replyId: string) => {
  emit('reply-select', props.activeReplyId === replyId ? undefined : replyId)
}

const submitReply = (replyId: string, body: string) => {
  const targetReply = findReply(replyId, props.replies)
  emit('reply-submit', targetReply ? workspaceDiscussionReplyParentId(targetReply) : replyId, body)
}

const findReply = (
  replyId: string,
  replies: WorkspaceDiscussionReplyViewModel[]
): WorkspaceDiscussionReplyViewModel | undefined => {
  for (const reply of replies) {
    if (reply.id === replyId) return reply
    const nestedReply = findReply(replyId, reply.replies)
    if (nestedReply) return nestedReply
  }
  return undefined
}
</script>

<template>
  <section class="mx-auto w-full space-y-5 pb-4 sm:space-y-6">
    <div class="flex items-center justify-between gap-3">
      <AtomicButton variant="text-button" size="sm" class="min-h-11" @click="emit('back')">
        <template #icon-left><ArrowLeft class="h-4 w-4" aria-hidden="true" /></template>
        Kembali ke diskusi
      </AtomicButton>
      <span class="hidden truncate font-body-3 text-neutral-500 sm:block" :title="discussion.projectTitle">
        {{ discussion.projectTitle }}
      </span>
    </div>

    <article class="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div class="p-4 sm:p-6 lg:p-8">
        <div class="flex items-start justify-between gap-4">
          <div class="flex min-w-0 items-center gap-3">
            <AtomicAvatar :name="discussion.author.name" :size="'sm'" />
            <div class="min-w-0">
              <p class="truncate font-label-2 text-secondary-900">{{ discussion.author.name }}</p>
              <time class="font-body-3 text-neutral-500" :datetime="discussion.createdAt">
                {{ formatDate(discussion.createdAt) }}
              </time>
            </div>
          </div>
          <div v-if="discussion.canEdit || discussion.canDelete" class="flex shrink-0 items-center gap-1">
            <AtomicButton v-if="discussion.canEdit" variant="outline" size="sm" @click="openEdit">
              <template #icon-left><Pencil class="h-4 w-4" aria-hidden="true" /></template>
              Edit
            </AtomicButton>
            <AtomicButton v-if="discussion.canDelete" variant="danger" size="sm" @click="deleteDialogOpen = true">
              <template #icon-left><Trash2 class="h-4 w-4" aria-hidden="true" /></template>
              Hapus
            </AtomicButton>
          </div>
        </div>
        <h1 class="mt-5 break-words font-title-1 leading-tight tracking-tight text-secondary-900 sm:mt-6">
          {{ discussion.title }}
        </h1>
        <p class="mt-5 max-w-4xl whitespace-pre-wrap break-words font-paragraph-3 leading-relaxed text-neutral-700">
          {{ discussion.body }}
        </p>
        <p v-if="mutationError" class="mt-4 rounded-lg bg-danger-50 p-3 font-body-3 text-danger-800" role="alert">
          {{ mutationError }}
        </p>
      </div>
      <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 font-body-3 text-neutral-600">
          <span>{{ discussion.participantCount }} peserta</span>
          <span>{{ discussion.replyCount }} tanggapan</span>
        </div>
        <AtomicButton v-if="canWrite" variant="text-button" size="sm" class="min-h-11" :aria-expanded="activeReplyId === null" @click="selectTopicReply">
          <template #icon-left><MessageCircle class="h-4 w-4" aria-hidden="true" /></template>
          {{ activeReplyId === null ? 'Tutup balasan' : 'Balas topik' }}
        </AtomicButton>
      </footer>
    </article>

    <WorkspaceDiscussionReplyComposer
      v-if="canWrite && activeReplyId === null"
      :model-value="replyDraft"
      heading="Balas topik"
      placeholder="Bagikan sudut pandang atau pertanyaan untuk topik ini…"
      :pending="mutationPending"
      @update:model-value="emit('reply-draft-update', $event)"
      @submit="submitTopicReply"
      @cancel="emit('reply-select', undefined)"
    />

    <section class="space-y-4" aria-labelledby="discussion-replies-title">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <h2 id="discussion-replies-title" class="font-title-2 text-secondary-900">Tanggapan</h2>
          <span class="font-body-3 text-neutral-500" aria-live="polite">{{ discussion.replyCount }}</span>
        </div>
      </div>

      <ol v-if="replies.length" class="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white px-4 sm:px-6" aria-label="Daftar tanggapan">
        <li v-for="reply in replies" :key="reply.id" class="py-5 sm:py-6">
          <WorkspaceDiscussionReplyItem
            :reply="reply"
            :reply-to-name="null"
            :can-write="canWrite && !reply.parentReplyId && !reply.isDeleted"
            :time-label="formatDate"
            :active-reply-id="activeReplyId"
            :reply-draft="replyDraft"
            :mutation-pending="mutationPending"
            level="answer"
            @reply-draft-update="emit('reply-draft-update', $event)"
            @reply-submit="submitReply"
            @reply-select="selectReply"
            @reply-update="(replyId, body) => emit('reply-update', replyId, body)"
            @reply-delete="emit('reply-delete', $event)"
          />

          <ol v-if="reply.replies.length" class="ml-4 mt-4 space-y-4 border-l-2 border-neutral-200 pl-4 sm:ml-10 sm:pl-6" aria-label="Balasan pada tanggapan">
            <li v-for="followUp in reply.replies" :key="followUp.id">
              <WorkspaceDiscussionReplyItem
                :reply="followUp"
                :reply-to-name="reply.author.name"
                :can-write="canWrite && !reply.isDeleted && !followUp.isDeleted"
                :time-label="formatDate"
                :active-reply-id="activeReplyId"
                :reply-draft="replyDraft"
                :mutation-pending="mutationPending"
                level="follow-up"
                @reply-draft-update="emit('reply-draft-update', $event)"
                @reply-submit="submitReply"
                @reply-select="selectReply"
                @reply-update="(replyId, body) => emit('reply-update', replyId, body)"
                @reply-delete="emit('reply-delete', $event)"
              />
            </li>
          </ol>
        </li>
      </ol>

      <div v-else class="rounded-xl border border-neutral-200 bg-white px-5 py-7 sm:px-7">
        <p class="font-label-2 text-secondary-900">Belum ada tanggapan</p>
        <p class="mt-1 font-body-3 leading-relaxed text-neutral-500">Jadilah yang pertama membagikan sudut pandang atau pertanyaan untuk topik ini.</p>
      </div>

      <div v-if="hasMoreReplies" class="flex justify-center">
        <AtomicButton variant="outline" size="sm" :disabled="repliesPending" @click="emit('reply-load-more')">
          {{ repliesPending ? 'Memuat…' : 'Muat tanggapan lainnya' }}
        </AtomicButton>
      </div>
    </section>

    <p v-if="writeStatusKnown && !canWrite" class="border-t border-neutral-200 pt-4 font-body-3 text-neutral-500">
      Proyek ini sedang dalam mode baca saja untuk diskusi.
    </p>

    <OrganismModal
      v-model="editDialogOpen"
      title="Edit diskusi"
      subtitle="Perubahan akan terlihat oleh seluruh anggota proyek."
      size="lg"
      :primary-label="mutationPending ? 'Menyimpan…' : 'Simpan perubahan'"
      :primary-loading="mutationPending"
      :primary-disabled="mutationPending || !editTitle.trim() || !editBody.trim()"
      secondary-label="Batal"
      @on-primary-click="submitEdit"
      @on-secondary-click="editDialogOpen = false"
      @close="editDialogOpen = false"
    >
      <form class="space-y-4" @submit.prevent="submitEdit">
        <MoleculeInputField v-model="editTitle" label="Topik" required :maxlength="160" />
        <MoleculeTextarea v-model="editBody" label="Pesan" :rows="6" :maxlength="10000" show-counter required />
        <p v-if="mutationError" class="rounded-lg bg-danger-50 p-3 font-body-3 text-danger-800" role="alert">{{ mutationError }}</p>
      </form>
    </OrganismModal>

    <OrganismModal
      v-model="deleteDialogOpen"
      title="Hapus diskusi?"
      subtitle="Topik dan seluruh tanggapannya akan dihapus dari ruang diskusi."
      size="sm"
      :primary-label="mutationPending ? 'Menghapus…' : 'Hapus diskusi'"
      :primary-loading="mutationPending"
      :primary-disabled="mutationPending"
      primary-variant="danger"
      secondary-label="Batal"
      @on-primary-click="emit('discussion-delete')"
      @on-secondary-click="deleteDialogOpen = false"
      @close="deleteDialogOpen = false"
    >
      <p class="font-body-2 text-neutral-600">{{ discussion.title }}</p>
      <p v-if="mutationError" class="mt-3 rounded-lg bg-danger-50 p-3 font-body-3 text-danger-800" role="alert">{{ mutationError }}</p>
    </OrganismModal>
  </section>
</template>
