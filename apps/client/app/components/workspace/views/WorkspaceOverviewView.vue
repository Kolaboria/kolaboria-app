<script setup lang="ts">
import { ScanEye, UsersRound } from "@lucide/vue";
import type { WorkspaceOverviewContext } from "~/composables/useWorkspaceController";
import type { WorkspacePrototypeTask } from "~/utils/workspace-prototype-state";
import { personFor } from "~/utils/workspace-prototype-state";

const emit = defineEmits<{
  "view-change": [view: "tasks" | "discussion" | "activity" | "info"];
  "filter-change": [filter: "all" | "mine" | "review"];
  "open-task": [task: WorkspacePrototypeTask];
}>();
const props = defineProps<{ context: WorkspaceOverviewContext }>();
const {
  state,
  currentUser,
  isOwner,
  isProjectManager,
  taskGroups,
  activeTaskCount,
  completedTaskCount,
  progress,
  reviewCount,
  currentProject,
  projectMembers,
  myActiveTasks,
  dateLabel,
  timeLabel,
  taskStatusLabel,
  taskStatusTone,
} = props.context;
</script>

<template>
  <section class="space-y-4 sm:space-y-5">
    <button
      v-if="reviewCount && isProjectManager"
      type="button"
      class="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50/70 px-4 py-3 text-left transition-colors hover:bg-primary-50 sm:px-5"
      @click="emit('view-change', 'tasks')"
    >
      <span class="flex items-start gap-3"
        ><span
          class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-primary-700"
          ><ScanEye class="h-4 w-4" aria-hidden="true" /></span
        ><span
          ><strong class="block font-label-2 text-primary-900"
            >{{ reviewCount }} task menunggu review</strong
          ><span class="font-body-3 text-secondary-700"
            >Tinjau hasil pekerjaan agar proyek terus bergerak.</span
          ></span
        ></span
      >
      <span
        class="rounded-lg border border-primary-200 bg-white px-3 py-2 font-label-3 text-primary-800"
        >Buka Kanban</span
      >
    </button>

    <div
      v-if="currentProject.status === 'preparing'"
      class="flex flex-col gap-3 rounded-xl border border-accent-200 bg-accent-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      <div class="flex gap-3">
        <UsersRound
          class="mt-0.5 h-5 w-5 shrink-0 text-accent-700"
          aria-hidden="true"
        />
        <div>
          <p class="font-label-2 text-accent-900">
            Workspace menunggu owner memulai proyek
          </p>
          <p class="mt-1 font-body-3 text-accent-900/80">
            Periksa kesiapan setiap peran di informasi proyek.
          </p>
        </div>
      </div>
      <AtomicButton
        v-if="isOwner"
        variant="outline"
        size="sm"
        @click="emit('view-change', 'info')"
        >Periksa kesiapan</AtomicButton
      >
    </div>

    <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <section class="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <p class="font-body-3 text-neutral-500">Progres tugas</p>
        <p class="mt-2 font-title-1 text-secondary-900">{{ progress }}%</p>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            class="h-full rounded-full bg-primary-600 transition-[width]"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <p class="mt-2 font-body-3 text-neutral-500">
          {{ completedTaskCount }} dari {{ activeTaskCount }} task selesai
        </p>
      </section>
      <section class="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <p class="font-body-3 text-neutral-500">Tugas berjalan</p>
        <p class="mt-2 font-title-1 text-secondary-900">
          {{ taskGroups.doing.length }}
        </p>
        <p class="mt-2 font-body-3 text-neutral-500">Sedang dikerjakan</p>
      </section>
      <section class="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <p class="font-body-3 text-neutral-500">Perlu review</p>
        <p class="mt-2 font-title-1 text-secondary-900">
          {{ reviewCount }}
        </p>
        <p class="mt-2 font-body-3 text-neutral-500">Butuh tindak lanjut</p>
      </section>
      <section class="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <p class="font-body-3 text-neutral-500">Anggota tim</p>
        <p class="mt-2 font-title-1 text-secondary-900">
          {{ projectMembers.length }}
        </p>
        <p class="mt-2 font-body-3 text-neutral-500">Berkolaborasi</p>
      </section>
    </div>

    <div class="grid gap-4">
      <section class="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div
          class="flex items-center justify-between gap-3 border-b border-neutral-200 pb-3"
        >
          <h2 class="font-title-3 text-secondary-900">Prioritas saya</h2>
          <AtomicButton
            type="button"
            variant="text-button"
            size="sm"
            @click="
              emit('filter-change', 'mine');
              emit('view-change', 'tasks');
            "
          >
            Semua tugas
          </AtomicButton>
        </div>
        <div v-if="myActiveTasks.length" class="divide-y divide-neutral-100">
          <button
            v-for="task in myActiveTasks.slice(0, 5)"
            :key="task.id"
            type="button"
            class="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-neutral-50"
            @click="emit('open-task', task)"
          >
            <span class="min-w-0"
              ><span class="block truncate font-label-2 text-primary-800">{{
                task.title
              }}</span
              ><span class="mt-1 block font-body-3 text-neutral-500"
                >{{ currentUser?.name }} · Tenggat
                {{ dateLabel(task.dueDate) }}</span
              ></span
            >
            <AtomicTag :variant="taskStatusTone(task.status)">{{
              taskStatusLabel(task.status)
            }}</AtomicTag>
          </button>
        </div>
        <p class="py-8 text-center font-body-2 text-neutral-500">
          Tidak ada task aktif untukmu.
        </p>
      </section>
    </div>

    <div class="grid gap-4 xl:grid-cols-[1.25fr_0.85fr]">
      <section class="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div
          class="flex items-center justify-between border-b border-neutral-200 pb-3"
        >
          <h2 class="font-title-3 text-secondary-900">Diskusi terbaru</h2>
          <AtomicButton
            type="button"
            variant="text-button"
            size="sm"
            @click="emit('view-change', 'discussion')"
          >
            Lihat diskusi
          </AtomicButton>
        </div>
        <button
          v-for="discussion in currentProject.discussions.slice(0, 2)"
          :key="discussion.id"
          type="button"
          class="block w-full border-b border-neutral-100 py-3 text-left last:border-0 hover:bg-neutral-50"
          @click="emit('view-change', 'discussion')"
        >
          <strong class="block font-label-2 text-secondary-900">{{
            discussion.title
          }}</strong
          ><span class="mt-1 block font-body-3 text-neutral-500"
            >{{ personFor(state, discussion.authorId)?.name }} ·
            {{ timeLabel(discussion.createdAt) }}</span
          >
        </button>
        <p
          v-if="!currentProject.discussions.length"
          class="py-6 text-center font-body-2 text-neutral-500"
        >
          Belum ada diskusi proyek.
        </p>
      </section>
      <section class="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div
          class="flex items-center justify-between border-b border-neutral-200 pb-3"
        >
          <h2 class="font-title-3 text-secondary-900">Aktivitas terkini</h2>
          <AtomicButton
            type="button"
            variant="text-button"
            size="sm"
            @click="emit('view-change', 'activity')"
          >
            Lihat semua
          </AtomicButton>
        </div>
        <div
          v-for="activity in currentProject.activities.slice(0, 3)"
          :key="activity.id"
          class="border-b border-neutral-100 py-3 last:border-0"
        >
          <p class="font-body-2 text-secondary-800">
            <strong class="font-label-3">{{
              personFor(state, activity.actorId)?.name
            }}</strong>
            {{ activity.text }}
          </p>
          <span class="font-body-3 text-neutral-500">{{
            timeLabel(activity.createdAt)
          }}</span>
        </div>
        <p
          v-if="!currentProject.activities.length"
          class="py-6 text-center font-body-2 text-neutral-500"
        >
          Aktivitas proyek akan muncul di sini.
        </p>
      </section>
    </div>
  </section>
</template>
