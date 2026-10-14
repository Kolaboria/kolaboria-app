<script setup lang="ts">
import { Archive, FilePenLine, Trash2 } from '@lucide/vue'
import type { ProjectLifecycleAction, ProjectLifecycleTarget } from '~/types/project-editor'

defineProps<{ status: ProjectLifecycleTarget['status']; canManage: boolean; disabled?: boolean }>()
const emit = defineEmits<{ select: [action: ProjectLifecycleAction] }>()
const buttonClass = 'flex w-full items-center gap-2 px-3.5 py-2 font-body-2 text-secondary transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50'
</script>

<template>
  <div v-if="canManage && (status === 'draft' || status === 'open')">
    <button v-if="status === 'open'" type="button" :class="buttonClass" :disabled="disabled" @click="emit('select', 'draft')">
      <FilePenLine class="size-4 text-tertiary" /> Kembalikan ke Draft
    </button>
    <button v-if="status === 'open'" type="button" :class="buttonClass" :disabled="disabled" @click="emit('select', 'archived')">
      <Archive class="size-4 text-tertiary" /> Arsipkan Proyek
    </button>
    <button v-if="status === 'draft'" type="button" :class="[buttonClass, '!text-danger-700']" :disabled="disabled" @click="emit('select', 'delete')">
      <Trash2 class="size-4" /> Hapus Draft
    </button>
  </div>
</template>
