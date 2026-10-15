<script setup lang="ts">
import { nextTick, ref } from "vue";
import { GripVertical, Plus } from "@lucide/vue";
import { useDraggable } from "vue-draggable-plus";
import type { WorkspaceTasksContext } from "~/composables/useWorkspaceController";
import type {
  WorkspacePrototypeTask,
  WorkspacePrototypeTaskStatus,
} from "~/utils/workspace-prototype-state";
import { personFor } from "~/utils/workspace-prototype-state";

type BoardTaskStatus = Exclude<WorkspacePrototypeTaskStatus, "cancelled">;
type MoveTaskStatus = Exclude<WorkspacePrototypeTaskStatus, "cancelled">;

const props = defineProps<{
  status: BoardTaskStatus;
  title: string;
  tasks: WorkspacePrototypeTask[];
  context: WorkspaceTasksContext;
}>();

const emit = defineEmits<{
  "open-task": [task: WorkspacePrototypeTask];
  "create-task": [];
  "task-status-change": [taskId: string, status: MoveTaskStatus];
}>();

const {
  state,
  canManageTasks,
  isProjectManager,
  canDragTask,
  currentProject,
  shortDate,
  priorityLabel,
} = props.context;
const taskList = ref<HTMLElement | null>(null);
const renderVersion = ref(0);

useDraggable(taskList, {
  group: {
    name: "workspace-task-status",
    pull: true,
    put: (target, _source, draggedElement) => {
      const targetStatus = target.el.dataset.taskStatus;
      const task = currentProject.value.tasks.find(
        (item) => item.id === draggedElement.dataset.taskId,
      );
      if (!task || !canDragTask(task)) return false;
      if (targetStatus === "closed") {
        return (
          isProjectManager.value &&
          !["done", "closed", "cancelled"].includes(task.status)
        );
      }
      return (
        targetStatus !== "done" ||
        currentProject.value.ownerId === state.value.currentUserId
      );
    },
  },
  draggable: '[data-task-draggable="true"]',
  sort: false,
  animation: 160,
  delay: 120,
  delayOnTouchOnly: true,
  touchStartThreshold: 4,
  ghostClass: "sortable-ghost",
  chosenClass: "sortable-chosen",
  onEnd: (event) => {
    const taskId = event.item.dataset.taskId;
    const targetStatus = event.to.dataset.taskStatus;
    if (
      event.from !== event.to &&
      taskId &&
      targetStatus &&
      targetStatus !== "cancelled"
    ) {
      emit(
        "task-status-change",
        taskId,
        targetStatus as MoveTaskStatus,
      );
    }
    void nextTick(() => {
      renderVersion.value += 1;
    });
  },
});
</script>

<template>
  <section
    class="isolate flex min-h-[390px] min-w-0 flex-col rounded-xl border border-neutral-300 bg-white p-3"
    :aria-label="`Kolom ${title}`"
  >
    <div
      class="sticky top-0 z-10 -mx-2.5 -mt-2.5 flex min-w-0 items-center justify-between gap-2 rounded-t-xl border-b border-primary-200 bg-primary-50 px-3 pb-2.5 pt-3"
    >
      <h2 class="font-label-2 text-secondary-900">{{ title }}</h2>
      <span class="font-label-3 text-neutral-500">{{ tasks.length }}</span>
    </div>

    <div
      ref="taskList"
      class="mt-3 flex flex-1 flex-col gap-3"
      :data-task-status="status"
      role="list"
      :aria-label="`${title}, ${tasks.length} task`"
    >
      <article
        v-for="task in tasks"
        :key="`${renderVersion}-${task.id}`"
        :data-task-id="task.id"
        :data-task-draggable="canDragTask(task) ? 'true' : 'false'"
        role="listitem"
        class="workspace-task-card w-full min-w-0 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition hover:border-primary-300 hover:shadow-md"
        :class="canDragTask(task) ? 'cursor-grab active:cursor-grabbing' : ''"
      >
        <div class="flex items-start justify-between gap-2">
          <button
            v-if="canDragTask(task)"
            type="button"
            :data-task-drag-handle="true"
            class="workspace-task-drag-handle grid h-8 w-8 shrink-0 place-items-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-secondary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            :aria-label="`Seret untuk mengubah status ${task.title}`"
            title="Seret untuk mengubah status"
            @click.stop.prevent
          >
            <GripVertical class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          class="mt-2 block w-full text-left focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          @click="emit('open-task', task)"
        >
          <h3 class="break-words font-label-2 leading-snug text-secondary-900">
            {{ task.title }}
          </h3>
          <p
            v-if="task.description"
            class="mt-1.5 line-clamp-2 font-body-3 text-neutral-500"
          >
            {{ task.description }}
          </p>
          <AtomicTag
            class="mt-2"
            :variant="
              task.priority === 'high'
                ? 'danger'
                : task.priority === 'low'
                  ? 'default'
                  : 'warning'
            "
          >
            Prioritas {{ priorityLabel(task.priority).toLowerCase() }}
          </AtomicTag>
          <div
            class="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-2.5"
          >
            <span
              class="inline-flex min-w-0 items-center gap-1.5 font-body-3 text-neutral-600"
            >
              <AtomicAvatar
                v-if="task.assigneeId"
                :name="personFor(state, task.assigneeId)?.name ?? '?'"
                :size="'xs'"
              />
              <span class="truncate">
                {{
                  personFor(state, task.assigneeId)?.name ?? "Belum ditentukan"
                }}
              </span>
            </span>
            <span class="font-body-3 text-neutral-500">{{
              shortDate(task.dueDate)
            }}</span>
          </div>
          <p
            v-if="task.status === 'closed'"
            class="mt-2 line-clamp-2 rounded-md bg-neutral-50 px-2 py-1.5 font-body-3 text-neutral-500"
          >
            Alasan: {{ task.closeReason }}
          </p>
          <span class="mt-2 block font-body-3 text-neutral-500">
            {{ task.comments.length }} komentar · Lihat detail
          </span>
        </button>
      </article>

      <p
        v-if="!tasks.length"
        class="rounded-lg border border-dashed border-neutral-300 px-3 py-7 text-center font-body-3 text-neutral-500"
      >
        Belum ada task
      </p>
    </div>
  </section>
</template>

<style scoped>
.sortable-ghost {
  opacity: 0.35;
}

.sortable-chosen {
  border-color: var(--color-primary-400);
  box-shadow: 0 8px 20px rgb(15 23 42 / 12%);
}

.workspace-task-drag-handle {
  touch-action: none;
}
</style>
