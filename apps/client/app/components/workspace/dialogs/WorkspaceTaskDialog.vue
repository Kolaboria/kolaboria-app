<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import type { WorkspaceTaskDialogContext } from '~/composables/useWorkspaceController'
import { personFor } from '~/utils/workspace-prototype-state'

const emit = defineEmits<{
  'comment-submit': []
  'delete-task': []
  'close-task': []
}>()
const props = defineProps<{ context: WorkspaceTaskDialogContext }>()
const {
  state,
  currentUser,
  isProjectManager,
  selectedTask,
  taskReadOnly,
  taskIsClosed,
  canManageTasks,
  currentProject,
  taskForm,
  taskError,
  assigneeOptions,
  taskStatuses,
  timeLabel,
} = props.context
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-2">
      <MoleculeInputField
        v-model="taskForm.title"
        label="Judul task"
        placeholder="Contoh: Susun alur onboarding"
        required
        :disabled="taskReadOnly"
      />
      <MoleculeDropdown
        v-if="!selectedTask && !isProjectManager"
        :model-value="state.currentUserId"
        label="Penanggung jawab"
        :options="[
        {
        label: currentUser?.name ?? 'Kamu',
        value: state.currentUserId,
        },
        ]"
        disabled
      />
      <MoleculeDropdown
        v-if="isProjectManager"
        v-model="taskForm.assigneeId"
        label="Penanggung jawab"
        :options="assigneeOptions"
        placeholder="Pilih anggota"
        :disabled="taskReadOnly"
      />
      <MoleculeDropdown
        v-if="isProjectManager"
        v-model="taskForm.priority"
        label="Prioritas"
        :options="[
        { label: 'Rendah', value: 'low' },
        { label: 'Sedang', value: 'medium' },
        { label: 'Tinggi', value: 'high' },
        ]"
        placeholder="Pilih prioritas"
        :disabled="taskReadOnly"
      />
      <MoleculeInputField
        v-if="isProjectManager"
        v-model="taskForm.dueDate"
        label="Target selesai"
        type="date"
        :disabled="taskReadOnly"
      />
    </div>
    <MoleculeTextarea
      v-model="taskForm.description"
      label="Deskripsi dan hasil yang diharapkan"
      placeholder="Jelaskan konteks dan arti task ini selesai..."
      :rows="3"
      :disabled="taskReadOnly"
    />
    <MoleculeDropdown
      v-if="
      selectedTask &&
      selectedTask.status !== 'cancelled'
      "
      v-model="taskForm.status"
      label="Status"
      :options="
      [
      ...(selectedTask.status === 'closed'
      ? [{ value: 'closed', label: 'Ditutup' }]
      : []),
      ...taskStatuses.filter(
      (item) => isProjectManager || item.value !== 'done',
      ),
      ]
      "
      placeholder="Pilih status"
      :disabled="currentProject?.status !== 'in_progress'"
    />
      <p
        v-if="selectedTask && !isProjectManager && !taskIsClosed"
        class="rounded-lg bg-primary-50 p-3 font-body-3 text-primary-900"
        >
        Sebagai contributor, kamu dapat memperbarui status task milikmu dan
        mengirim hasil untuk direview owner.
      </p>
      <p
        v-if="taskError"
        class="rounded-lg bg-danger-50 p-3 font-body-3 text-danger-700"
        role="alert"
        >
        {{ taskError }}
      </p>
      <div
        v-if="selectedTask && taskIsClosed"
        class="rounded-lg border border-neutral-200 bg-neutral-50 p-3"
        >
        <p class="font-label-3 text-secondary-800">Task ditutup</p>
          <p class="mt-1 font-body-3 text-neutral-600">
            Alasan:
            {{ selectedTask.closeReason || "Task ini sudah ditutup." }}
          </p>
        </div>
        <div v-if="selectedTask" class="border-t border-neutral-200 pt-4">
          <div class="flex items-center justify-between">
            <h3 class="font-label-2 text-secondary-900">Komentar task</h3>
              <AtomicTag>{{ selectedTask.comments.length }}</AtomicTag>
              </div>
              <div v-if="selectedTask.comments.length" class="mt-3 space-y-2">
                <div
                  v-for="comment in selectedTask.comments"
                  :key="comment.id"
                  class="flex gap-2.5 rounded-lg bg-neutral-50 p-3"
                  >
                  <AtomicAvatar
                    :name="personFor(state, comment.authorId)?.name ?? 'Anggota'"
                    :size="'xs'"
                  />
                  <div>
                    <p class="font-label-3 text-secondary-900">
                      {{ personFor(state, comment.authorId)?.name }}
                      <span
                        class="ml-1 font-body-3 font-normal text-neutral-500"
                        >{{ timeLabel(comment.createdAt) }}</span
                        >
                      </p>
                      <p
                        class="mt-1 whitespace-pre-wrap font-body-3 text-neutral-700"
                        >
                        {{ comment.body }}
                      </p>
                    </div>
                  </div>
                </div>
                <p
                  v-else-if="!taskIsClosed"
                  class="mt-3 font-body-3 text-neutral-500"
                  >
                  Belum ada komentar. Tambahkan update atau pertanyaan.
                </p>
                <div v-if="!taskIsClosed" class="mt-3 flex items-end gap-2">
                  <MoleculeTextarea
                    v-model="taskForm.comment"
                    label=""
                    placeholder="Tulis komentar..."
                    :rows="2"
                    class="min-w-0 flex-1"
                    /><AtomicButton
                      variant="outline"
                      size="sm"
                      :disabled="!taskForm.comment.trim()"
                      @click="emit('comment-submit')"
                      >Kirim</AtomicButton
                      >
                    </div>
                  </div>
                  <div
                    v-if="
                    selectedTask &&
                    canManageTasks &&
                    currentProject?.status === 'in_progress' &&
                    !['done', 'closed', 'cancelled'].includes(selectedTask.status)
                    "
                    class="border-t border-neutral-200 pt-4"
                    >
                    <div class="flex justify-end">
                      <AtomicButton
                        variant="ghost-danger"
                        size="sm"
                        @click="emit('delete-task')"
                        >
                        <template #icon-left>
                          <Trash2 class="h-4 w-4" aria-hidden="true" />
</template>
                Hapus task
              </AtomicButton>
            </div>
          </div>
          <div
            v-if="
              selectedTask &&
              isProjectManager &&
              selectedTask.status !== 'done' &&
              selectedTask.status !== 'closed' &&
              selectedTask.status !== 'cancelled' &&
              currentProject?.status === 'in_progress'
            "
            class="border-t border-neutral-200 pt-4"
          >
            <h3 class="font-label-2 text-secondary-900">
              Tutup task karena perubahan scope
            </h3>
            <p class="mt-1 font-body-3 text-neutral-500">
              Task tetap tercatat dan tidak dihitung sebagai hasil selesai.
            </p>
            <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <MoleculeInputField
                v-model="taskForm.closeReason"
                label="Alasan"
                placeholder="Contoh: kebutuhan digabung ke task lain"
                class="min-w-0 flex-1"
              /><AtomicButton
                variant="outline-danger"
                size="sm"
                :disabled="!taskForm.closeReason.trim()"
                @click="emit('close-task')"
                >Tutup task</AtomicButton
              >
            </div>
          </div>
        </div>
</template>
