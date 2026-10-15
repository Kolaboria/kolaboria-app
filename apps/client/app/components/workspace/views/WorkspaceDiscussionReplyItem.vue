<script setup lang="ts">
import { ref, watch } from 'vue'
import { MessageCircle, Pencil, Trash2 } from '@lucide/vue'
import WorkspaceDiscussionReplyComposer from './WorkspaceDiscussionReplyComposer.vue'
import type { WorkspaceDiscussionReplyViewModel } from '~/types/workspace-discussion'

const props = defineProps<{
  reply: WorkspaceDiscussionReplyViewModel
  timeLabel?: (date: string) => string
  level: 'answer' | 'follow-up'
  replyToName?: string | null
  canWrite: boolean
  activeReplyId: string | null | undefined
  replyDraft: string
  mutationPending: boolean
}>()

const emit = defineEmits<{
  'reply-select': [replyId: string]
  'reply-draft-update': [value: string]
  'reply-submit': [replyId: string, body: string]
  'reply-update': [replyId: string, body: string]
  'reply-delete': [replyId: string]
}>()

const editOpen = ref(false)
const deleteOpen = ref(false)
const editBody = ref(props.reply.body)

watch(() => props.reply.updatedAt, () => {
  if (editOpen.value) editOpen.value = false
})
watch(() => props.reply.isDeleted, (deleted) => {
  if (deleted) editOpen.value = false
})

const submitEdit = () => {
  emit('reply-update', props.reply.id, editBody.value)
}
</script>

<template>
  <article class="min-w-0 break-words">
    <div class="flex items-start gap-3 sm:gap-4">
      <AtomicAvatar :name="reply.author.name" :size="level === 'answer' ? 'sm' : 'xs'" />
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div class="min-w-0">
            <p class="font-label-2 text-secondary-900">{{ reply.author.name }}</p>
            <p v-if="replyToName" class="mt-0.5 font-body-3 text-neutral-500">Membalas {{ replyToName }}</p>
            <time class="font-body-3 text-neutral-500" :datetime="reply.createdAt">
              {{ timeLabel ? timeLabel(reply.createdAt) : reply.createdAt }}
            </time>
          </div>
          <div v-if="reply.canEdit || reply.canDelete" class="flex items-center gap-1">
            <AtomicButton v-if="reply.canEdit" variant="ghost" size="sm" :aria-label="'Edit balasan'" @click="editBody = reply.body; editOpen = true">
              <Pencil class="h-4 w-4" aria-hidden="true" />
            </AtomicButton>
            <AtomicButton v-if="reply.canDelete" variant="danger" size="sm" :aria-label="'Hapus balasan'" @click="deleteOpen = true">
              <Trash2 class="h-4 w-4" aria-hidden="true" />
            </AtomicButton>
          </div>
        </div>

        <p v-if="reply.isDeleted" class="mt-3 italic font-body-3 text-neutral-500">
          Balasan ini telah dihapus.
        </p>
        <p v-else class="mt-3 whitespace-pre-wrap break-words font-body-2 leading-relaxed text-neutral-700">
          {{ reply.body }}
        </p>

        <AtomicButton
          v-if="canWrite && !reply.isDeleted"
          variant="text-button"
          size="sm"
          class="mt-2 min-h-11"
          :aria-expanded="activeReplyId === reply.id"
          @click="emit('reply-select', reply.id)"
        >
          <template #icon-left><MessageCircle class="h-4 w-4" aria-hidden="true" /></template>
          {{ activeReplyId === reply.id ? 'Tutup balasan' : 'Balas' }}
        </AtomicButton>

        <WorkspaceDiscussionReplyComposer
          v-if="canWrite && activeReplyId === reply.id"
          class="mt-3"
          :model-value="replyDraft"
          :heading="`Balas ${reply.author.name}`"
          placeholder="Tulis balasan untuk tanggapan ini…"
          :pending="mutationPending"
          @update:model-value="emit('reply-draft-update', $event)"
          @submit="emit('reply-submit', reply.id, replyDraft)"
          @cancel="emit('reply-select', reply.id)"
        />
      </div>
    </div>

    <OrganismModal
      v-model="editOpen"
      title="Edit balasan"
      subtitle="Balasan tetap berada di percakapan ini."
      size="md"
      :primary-label="mutationPending ? 'Menyimpan…' : 'Simpan perubahan'"
      :primary-loading="mutationPending"
      :primary-disabled="mutationPending || !editBody.trim()"
      secondary-label="Batal"
      @on-primary-click="submitEdit"
      @on-secondary-click="editOpen = false"
      @close="editOpen = false"
    >
      <MoleculeTextarea v-model="editBody" label="Isi balasan" :rows="4" :maxlength="2000" show-counter required />
    </OrganismModal>

    <OrganismModal
      v-model="deleteOpen"
      title="Hapus balasan?"
      subtitle="Teks balasan akan dihapus dan penanda tetap disimpan agar konteks percakapan terjaga."
      size="sm"
      :primary-label="mutationPending ? 'Menghapus…' : 'Hapus balasan'"
      :primary-loading="mutationPending"
      :primary-disabled="mutationPending"
      primary-variant="danger"
      secondary-label="Batal"
      @on-primary-click="emit('reply-delete', reply.id)"
      @on-secondary-click="deleteOpen = false"
      @close="deleteOpen = false"
    >
      <p class="font-body-2 text-neutral-600">{{ reply.body || 'Balasan ini' }}</p>
    </OrganismModal>
  </article>
</template>
