<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue'
import type { WorkspaceTeamContext } from '~/composables/useWorkspaceController'
import { personFor } from '~/utils/workspace-prototype-state'

const emit = defineEmits<{
  'member-tasks': [personId: string]
  'task-access-change': [personId: string, enabled: boolean]
}>()
const props = defineProps<{ context: WorkspaceTeamContext }>()
const { state, isOwner, currentProject, projectMembers } = props.context
</script>

<template>
  <section class="space-y-4">
    <div class="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="font-title-3 text-secondary-900">
            Anggota proyek
          </h2>
          <p class="mt-1 font-body-3 text-neutral-500">
            Owner mengatur pembagian kerja; contributor mengelola task
            miliknya.
          </p>
        </div>
        <AtomicTag>{{ projectMembers.length }} anggota</AtomicTag>
      </div>
      <div class="divide-y divide-neutral-100">
        <div
          v-for="person in projectMembers"
          :key="person.id"
          class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 py-4 first:pt-1 last:pb-1 sm:flex"
        >
          <AtomicAvatar :name="person.name" :size="'md'" />
          <div class="min-w-0 sm:flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="truncate font-label-2 text-secondary-900">
                {{ person.name }}
              </p>
              <AtomicTag v-if="person.id === currentProject.ownerId" variant="success">
                Owner
              </AtomicTag>
              <AtomicTag v-else-if="person.id === state.currentUserId" variant="primary">
                Kamu
              </AtomicTag>
            </div>
            <p class="mt-1 truncate font-body-3 text-neutral-500">
              {{ person.role }} ·
              {{
                currentProject.tasks.filter(
                  (task) =>
                    task.assigneeId === person.id &&
                    task.status !== 'done' &&
                    task.status !== 'closed' &&
                    task.status !== 'cancelled',
                ).length
              }}
              task aktif
            </p>
          </div>
          <div class="col-span-2 flex flex-wrap gap-2 border-t border-neutral-100 pt-3 sm:ml-auto sm:shrink-0 sm:border-0 sm:pt-0">
            <AtomicButton
              variant="outline"
              size="sm"
              @click="emit('member-tasks', person.id)"
            >
              Lihat tugas
            </AtomicButton>
            <AtomicButton
              v-if="
                isOwner &&
                currentProject.status === 'in_progress' &&
                person.id !== currentProject.ownerId
              "
              :variant="currentProject.taskManagerIds.includes(person.id) ? 'primary' : 'outline'"
              size="sm"
              class="flex-1 sm:flex-none"
              :aria-pressed="currentProject.taskManagerIds.includes(person.id)"
              @click="emit('task-access-change', person.id, !currentProject.taskManagerIds.includes(person.id))"
            >
              {{
                currentProject.taskManagerIds.includes(person.id)
                  ? 'Cabut izin task'
                  : 'Izinkan buat & hapus task'
              }}
            </AtomicButton>
          </div>
        </div>
      </div>
    </div>
    <div class="rounded-xl border border-primary-100 bg-primary-50/60 p-4">
      <div class="flex gap-3">
        <ShieldCheck
          class="mt-0.5 h-5 w-5 shrink-0 text-primary-700"
          aria-hidden="true"
        />
        <div>
          <p class="font-label-2 text-primary-900">
            Peran dan tanggung jawab
          </p>
          <p class="mt-1 font-body-3 text-primary-900/80">
            Owner mengatur task dan meninjau hasil proyek. Izin task
            tambahan hanya memberi contributor akses membuat dan
            menghapus task aktif, tanpa akses ke pengelolaan proyek.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
