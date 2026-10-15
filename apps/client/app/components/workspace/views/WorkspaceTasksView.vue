<script setup lang="ts">
import { X } from '@lucide/vue'
import type { WorkspaceTasksContext } from '~/composables/useWorkspaceController'
import type { WorkspacePrototypeTask, WorkspacePrototypeTaskStatus } from '~/utils/workspace-prototype-state'
import WorkspaceTaskColumn from './WorkspaceTaskColumn.vue'

type BoardTaskStatus = Exclude<WorkspacePrototypeTaskStatus, 'cancelled'>

const taskColumns: Array<{ status: BoardTaskStatus; title: string }> = [
  { status: 'todo', title: 'Akan dikerjakan' },
  { status: 'doing', title: 'Dikerjakan' },
  { status: 'review', title: 'Perlu review' },
  { status: 'done', title: 'Selesai' },
  { status: 'closed', title: 'Ditutup' },
]

const emit = defineEmits<{
  'assignee-filter': [personId: string]
  'clear-assignee-filter': []
  'open-task': [task: WorkspacePrototypeTask]
  'create-task': []
  'filter-change': [filter: 'all' | 'mine' | 'review']
  'search-change': [query: string]
  'task-status-change': [taskId: string, status: Exclude<WorkspacePrototypeTaskStatus, 'cancelled'>]
}>()
const props = defineProps<{ context: WorkspaceTasksContext }>()
const {
  taskFilter,
  assigneeFilter,
  searchQuery,
  projectMembers,
  visibleTaskGroups,
} = props.context
</script>

<template>
  <section
    class="flex min-h-0 flex-1 flex-col gap-2 sm:gap-4"
    >
    <div
      class="grid shrink-0 grid-cols-1 gap-2 rounded-xl border border-neutral-200 bg-white p-2 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4"
      >
      <div
        class="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2"
        role="group"
        aria-label="Filter task"
        >
        <button
          v-for="filter in [
          ['all', 'Semua'],
          ['mine', 'Tugas saya'],
          ['review', 'Perlu review'],
          ] as Array<['all' | 'mine' | 'review', string]>"
          :key="filter[0]"
          type="button"
          class="shrink-0 rounded-lg border px-2.5 py-1.5 font-label-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:px-3 sm:py-2"
          :class="
          taskFilter === filter[0]
          ? 'border-primary-300 bg-primary-50 text-primary-800'
          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          "
          :aria-pressed="taskFilter === filter[0]"
          @click="emit('filter-change', filter[0])"
          >
          {{ filter[1] }}
        </button>
      </div>
      <div
        class="flex min-w-0 items-center gap-2 sm:ml-auto sm:flex-1 sm:justify-end"
        >
        <span
          class="hidden shrink-0 font-body-3 text-neutral-500 sm:inline"
          aria-hidden="true"
          >Anggota</span
          >
          <span
            class="hidden h-7 shrink-0 border-l border-neutral-200 sm:block"
            aria-hidden="true"
          />
          <div
            class="flex shrink-0 items-center"
            role="group"
            aria-label="Filter tugas berdasarkan anggota"
            >
            <button
              v-for="person in projectMembers"
              :key="person.id"
              type="button"
              class="relative -ml-1 rounded-full border-2 border-transparent bg-white transition-transform first:ml-0 hover:z-10 hover:scale-110 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              :class="
              assigneeFilter === person.id
              ? 'z-[1] scale-110 border-primary-600 ring-2 ring-primary-300 shadow-md'
              : 'z-0'
              "
              :aria-label="`Filter tugas: ${person.name}`"
              :aria-pressed="assigneeFilter === person.id"
              :title="`${person.name}${assigneeFilter === person.id ? ' · filter aktif' : ''}`"
              @click="emit('assignee-filter', person.id)"
              >
              <AtomicAvatar :name="person.name" :size="'sm'" />
            </button>
          </div>
          <button
            v-if="assigneeFilter"
            type="button"
            aria-label="Hapus filter anggota"
            title="Hapus filter anggota"
            class="grid h-7 w-7 shrink-0 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-secondary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            @click="emit('clear-assignee-filter')"
            >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
          <MoleculeSearchField
            placeholder="Cari tugas..."
            :model-value="searchQuery"
            @update:model-value="emit('search-change', String($event))"
            class="min-w-0 flex-1 sm:max-w-[260px]"
          />
        </div>
      </div>
      <div
        class="-mx-4 min-h-0 flex-1 overflow-auto px-4 pb-2 sm:mx-0 sm:px-0"
        aria-label="Board Kanban, gulir untuk melihat seluruh task"
      >
        <div class="grid min-h-full min-w-[1280px] auto-rows-max grid-cols-5 gap-3">
          <WorkspaceTaskColumn
            v-for="column in taskColumns"
            :key="column.status"
            :status="column.status"
            :title="column.title"
            :tasks="visibleTaskGroups[column.status]"
            :context="props.context"
            @open-task="emit('open-task', $event)"
            @create-task="emit('create-task')"
            @task-status-change="(taskId, status) => emit('task-status-change', taskId, status)"
          />
        </div>
      </div>
      <p class="hidden shrink-0 font-body-3 text-neutral-500 sm:block">
        Seret kartu untuk mengubah status; task penting akan meminta konfirmasi.
      </p>
    </section>
</template>
