<script setup lang="ts">
import { computed, provide, watch } from "vue";
import { ArrowLeft, Ellipsis, Plus } from "@lucide/vue";
import {
  useWorkspaceController,
  type WorkspaceActivityContext,
  type WorkspaceConfirmationDialogContext,
  type WorkspaceDiscussionContext,
  type WorkspaceOverviewContext,
  type WorkspaceProjectCloseDialogContext,
  type WorkspaceProjectInfoContext,
  type WorkspaceTaskDialogContext,
  type WorkspaceTasksContext,
  type WorkspaceTeamContext,
} from "~/composables/useWorkspaceController";
import { workspaceRouteContextKey } from "~/composables/workspace-route-context";
import WorkspaceConfirmationDialog from "./dialogs/WorkspaceConfirmationDialog.vue";
import WorkspaceTaskDialog from "./dialogs/WorkspaceTaskDialog.vue";
import WorkspaceProjectCloseDialog from "./dialogs/WorkspaceProjectCloseDialog.vue";

const workspace = useWorkspaceController();
const route = useRoute();
const {
  state,
  currentUser,
  isProjectManager,
  canManageTasks,
  reviewCount,
  canClose,
  notice,
  views,
  activeView,
  mobileMoreOpen,
  assigneeFilter,
  searchQuery,
  dialogOpen,
  dialogKind,
  pendingConfirmation,
  taskForm,
  resultSummary,
  currentProject,
  selectedTask,
  taskIsClosed,
  viewerRoleLabel,
  switchProject,
  switchPerson,
  statusLabel,
  activeTitle,
  activeDescription,
  goToView,
  goToPersonTasks,
  filterTasksByAssignee,
  setTaskFilter,
  moveTaskFromBoard,
  openTask,
  openNewTask,
  closeDialog,
  cancelConfirmation,
  confirmPendingAction,
  confirmTaskAccessChange,
  confirmProjectStart,
  confirmReadinessChange,
  saveTask,
  deleteSelectedTask,
  submitTaskComment,
  submitTaskClosure,
  openCloseProjectDialog,
  submitProjectClosure,
  confirmContributionReview,
  confirmContributionSharing,
  confirmContributionProposal,
  setContributionNote,
} = workspace;

watch(
  () => [String(route.params.slug ?? ""), state.value.projects] as const,
  ([projectSlug]) => {
    if (state.value.projects.some((project) => project.id === projectSlug)) {
      switchProject(projectSlug);
    }
  },
  { immediate: true },
);

const demoPeople = computed(() => {
  const memberIds = currentProject.value?.memberIds ?? [];
  return state.value.people.filter((person) => memberIds.includes(person.id));
});

const changeDemoProject = (event: Event) => {
  const projectId = (event.target as HTMLSelectElement).value;
  switchProject(projectId);
};

const changeDemoPerson = (event: Event) => {
  const personId = (event.target as HTMLSelectElement).value;
  switchPerson(personId);
};

const pickContext = <T extends object, const K extends readonly (keyof T)[]>(
  source: T,
  keys: K,
): Pick<T, K[number]> =>
  Object.fromEntries(keys.map((key) => [key, source[key]])) as Pick<
    T,
    K[number]
  >;

const workspaceViewSource = {
  ...workspace,
  currentProject: computed(() => {
    const project = currentProject.value;
    if (!project) {
      throw new Error("A Workspace view cannot render without a project.");
    }
    return project;
  }),
};

const overviewContext: WorkspaceOverviewContext = pickContext(workspaceViewSource, [
  "state",
  "currentUser",
  "isOwner",
  "isProjectManager",
  "taskGroups",
  "activeTaskCount",
  "completedTaskCount",
  "progress",
  "reviewCount",
  "currentProject",
  "projectMembers",
  "myActiveTasks",
  "dateLabel",
  "timeLabel",
  "taskStatusLabel",
  "taskStatusTone",
]);
const tasksContext: WorkspaceTasksContext = pickContext(workspaceViewSource, [
  "state",
  "canManageTasks",
  "isProjectManager",
  "canDragTask",
  "moveTaskFromBoard",
  "taskFilter",
  "assigneeFilter",
  "searchQuery",
  "currentProject",
  "projectMembers",
  "visibleTaskGroups",
  "shortDate",
  "priorityLabel",
]);
const teamContext: WorkspaceTeamContext = pickContext(workspaceViewSource, [
  "state",
  "isOwner",
  "currentProject",
  "projectMembers",
]);
const discussionContext: WorkspaceDiscussionContext = pickContext(workspaceViewSource, [
  "state",
  "currentProject",
  "timeLabel",
]);
const activityContext: WorkspaceActivityContext = pickContext(workspaceViewSource, [
  "state",
  "currentProject",
  "timeLabel",
]);
const projectInfoContext: WorkspaceProjectInfoContext = pickContext(workspaceViewSource, [
  "canClose",
  "activeTaskCount",
  "completedTaskCount",
  "progress",
  "openTasks",
  "closedTasks",
]);
const confirmationDialogContext: WorkspaceConfirmationDialogContext =
  pickContext(workspace, ["pendingConfirmation"]);
const taskDialogContext: WorkspaceTaskDialogContext = pickContext(workspace, [
  "state",
  "currentUser",
  "isProjectManager",
  "selectedTask",
  "taskReadOnly",
  "taskIsClosed",
  "canManageTasks",
  "currentProject",
  "taskForm",
  "taskError",
  "assigneeOptions",
  "taskStatuses",
  "timeLabel",
]);
const projectCloseDialogContext: WorkspaceProjectCloseDialogContext =
  pickContext(workspaceViewSource, [
    "completedTaskCount",
    "closedTasks",
    "resultSummary",
    "outcomeError",
  ]);

provide(workspaceRouteContextKey, {
  controller: workspace,
  views: {
    overview: overviewContext,
    tasks: tasksContext,
    team: teamContext,
    discussion: discussionContext,
    activity: activityContext,
    info: projectInfoContext,
  },
});
</script>

<template>
  <div
    class="flex h-dvh flex-col overflow-hidden bg-neutral-50 text-neutral-900"
  >
    <div class="flex min-h-0 flex-1">
      <aside
        class="sticky top-0 hidden h-dvh w-[218px] shrink-0 overflow-y-auto border-r border-neutral-200 bg-white px-3 py-5 lg:flex lg:flex-col"
      >
        <NuxtLink
          to="/home"
          class="mb-8 flex items-center gap-2 px-2.5"
          aria-label="Kolaboria home"
        >
          <img src="~/assets/img/logo.svg" alt="Kolaboria" class="h-7 w-auto" />
        </NuxtLink>

        <p
          class="px-2.5 pb-2 font-label-3 uppercase tracking-[0.12em] text-neutral-500"
        >
          Workspace
        </p>
        <nav class="space-y-1" aria-label="Navigasi workspace">
          <button
            v-for="view in views"
            :key="view.id"
            type="button"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left font-body-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            :class="
              activeView === view.id
                ? 'bg-primary-50 font-semibold text-primary-800'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-secondary-900'
            "
            :aria-current="activeView === view.id ? 'page' : undefined"
            @click="goToView(view.id)"
          >
            <component
              :is="view.icon"
              class="h-[18px] w-[18px] shrink-0"
              aria-hidden="true"
            />
            <span>{{ view.label }}</span>
            <span
              v-if="view.id === 'tasks' && reviewCount"
              class="ml-auto rounded-full bg-accent-100 px-1.5 py-0.5 font-label-3 text-accent-900"
              >{{ reviewCount }}</span
            >
          </button>
        </nav>

      </aside>

      <div
        class="flex h-full min-h-0 min-w-0 flex-1 flex-col"
        :class="activeView === 'tasks' ? 'overflow-hidden' : 'overflow-y-auto'"
      >
        <header
          class="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-7"
        >
          <nav
            class="flex min-w-0 items-center gap-2 font-body-3 text-neutral-500"
            aria-label="Breadcrumb workspace"
          >
            <NuxtLink
              :to="`/projects/${String(route.params.slug)}`"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-secondary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Kembali ke detail proyek"
              title="Kembali ke detail proyek"
            >
              <ArrowLeft class="h-4 w-4" aria-hidden="true" />
            </NuxtLink>
            <div class="flex min-w-0 items-center gap-1.5">
              <span class="hidden sm:inline">Kolaboria</span>
              <span class="hidden sm:inline" aria-hidden="true">/</span>
              <span>Workspace</span>
              <span aria-hidden="true">/</span>
              <span
              v-if="currentProject && activeView !== 'info'"
                class="truncate font-label-3 text-secondary-900"
                >{{ currentProject.title }}</span
              >
            </div>
          </nav>
          <div class="flex items-center gap-2 sm:gap-3">
            <div
              v-if="state.projects.length > 1 && activeView !== 'info'"
              class="flex items-center gap-1.5 sm:gap-2"
            >
              <span
                class="hidden rounded-full bg-primary-50 px-2 py-1 font-label-3 text-primary-800 md:inline-flex"
              >
                Demo
              </span>
              <label class="sr-only" for="workspace-demo-project">
                Skenario demo
              </label>
              <select
                id="workspace-demo-project"
                class="h-9 w-28 truncate rounded-lg border border-neutral-200 bg-white px-2 font-body-3 text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:w-44"
                :value="state.activeProjectId"
                @change="changeDemoProject"
              >
                <option
                  v-for="project in state.projects"
                  :key="project.id"
                  :value="project.id"
                >
                  {{ project.title }}
                </option>
              </select>
              <label class="sr-only" for="workspace-demo-person">
                Lihat sebagai pengguna demo
              </label>
              <select
                id="workspace-demo-person"
                class="h-9 w-24 truncate rounded-lg border border-neutral-200 bg-white px-2 font-body-3 text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:w-36"
                :value="state.currentUserId"
                @change="changeDemoPerson"
              >
                <option
                  v-for="person in demoPeople"
                  :key="person.id"
                  :value="person.id"
                >
                  {{ person.name }}
                </option>
              </select>
            </div>
            <div v-if="currentUser && activeView !== 'info'" class="hidden items-center gap-2 sm:flex">
              <AtomicAvatar :name="currentUser.name" :size="'sm'" />
              <div class="hidden min-w-0 xl:block">
                <p class="max-w-36 truncate font-label-3 text-secondary-900">
                  {{ currentUser.name }}
                </p>
                <p class="font-body-3 text-neutral-500">
                  {{ viewerRoleLabel
                  }}{{
                    canManageTasks && !isProjectManager ? " · Kelola task" : ""
                  }}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main
          class="mx-auto w-full px-4 pt-5 pb-3 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10"
          :class="
            activeView === 'tasks'
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden pt-3 sm:pt-7'
              : 'flex-none'
          "
        >
          <div
            class="flex flex-wrap items-end justify-between gap-3 sm:mb-6"
            :class="
              activeView === 'tasks' ? 'mb-2 shrink-0 sm:mb-6' : 'mb-5 sm:mb-6'
            "
          >
            <div class="min-w-0">
              <p
                v-if="currentProject && activeView !== 'info'"
                class="font-label-3 uppercase tracking-[0.1em] text-primary-700"
              >
                {{ currentProject?.title }}
              </p>
              <div class="mt-1.5 flex flex-wrap items-center gap-2">
                <h1 class="font-title-1 text-secondary-900">
                  {{ activeTitle }}
                </h1>
                <AtomicTag
                  v-if="currentProject && activeView !== 'info'"
                  :variant="
                    currentProject?.status === 'completed'
                      ? 'success'
                      : currentProject?.status === 'preparing'
                        ? 'warning'
                        : 'primary'
                  "
                  >{{ statusLabel }}</AtomicTag
                >
              </div>
              <p
                class="mt-1 font-body-2 text-neutral-500"
                :class="activeView === 'tasks' ? 'hidden sm:block' : ''"
              >
                {{ activeDescription }}
              </p>
            </div>
            <AtomicButton
              v-if="
                canManageTasks &&
                currentProject?.status === 'in_progress' &&
                ['overview', 'tasks'].includes(activeView)
              "
              variant="primary"
              size="sm"
              @click="openNewTask"
            >
              <template #icon-left
                ><Plus class="h-4 w-4" aria-hidden="true"
              /></template>
              Buat tugas
            </AtomicButton>
          </div>

          <slot v-if="currentProject || activeView === 'info'" />
          <section
            v-else
            class="mx-auto mt-8 w-full max-w-2xl rounded-xl border border-neutral-200 bg-white px-5 py-8 text-center sm:mt-12 sm:px-8 sm:py-10"
            aria-labelledby="workspace-empty-title"
          >
            <h2
              id="workspace-empty-title"
              class="font-title-3 text-secondary-900"
            >
              Data workspace belum tersedia
            </h2>
            <p class="mx-auto mt-2 max-w-lg font-body-2 text-neutral-500">
              Informasi proyek, anggota, tugas, diskusi, dan aktivitas akan
              muncul di sini setelah data proyek tersedia.
            </p>
          </section>
        </main>
      </div>
    </div>

    <nav
      class="relative z-40 shrink-0 border-t border-neutral-200 bg-white/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur lg:hidden"
      aria-label="Navigasi workspace mobile"
    >
      <div class="flex items-stretch justify-around">
        <button
          v-for="view in views.slice(0, 4)"
          :key="view.id"
          type="button"
          class="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 font-label-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :class="
            activeView === view.id ? 'text-primary-700' : 'text-neutral-500'
          "
          :aria-current="activeView === view.id ? 'page' : undefined"
          @click="goToView(view.id)"
        >
          <component :is="view.icon" class="h-5 w-5" aria-hidden="true" /><span
            class="max-w-full truncate"
            >{{ view.id === "tasks" ? "Tugas" : view.label }}</span
          >
        </button>
        <button
          type="button"
          class="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 font-label-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :class="
            ['activity', 'info'].includes(activeView) || mobileMoreOpen
              ? 'text-primary-700'
              : 'text-neutral-500'
          "
          :aria-expanded="mobileMoreOpen"
          @click="mobileMoreOpen = !mobileMoreOpen"
        >
          <Ellipsis class="h-5 w-5" aria-hidden="true" /><span>Lainnya</span>
        </button>
      </div>
      <div
        v-if="mobileMoreOpen"
        class="absolute inset-x-3 bottom-[calc(100%+0.5rem)] rounded-xl border border-neutral-200 bg-white p-2 shadow-lg"
      >
        <button
          v-for="view in views.slice(4)"
          :key="view.id"
          type="button"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left font-body-2"
          :class="
            activeView === view.id
              ? 'bg-primary-50 text-primary-800'
              : 'text-neutral-700 hover:bg-neutral-50'
          "
          @click="goToView(view.id)"
        >
          <component :is="view.icon" class="h-4 w-4" aria-hidden="true" />{{
            view.label
          }}
        </button>
      </div>
    </nav>

    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="notice"
        class="fixed bottom-20 left-4 right-4 z-[80] mx-auto max-w-md rounded-xl bg-secondary-800 px-4 py-3 font-body-2 text-white shadow-lg sm:bottom-6 sm:left-auto sm:right-6"
        role="status"
      >
        {{ notice }}
      </div>
    </Transition>

    <OrganismModal
      v-model="dialogOpen"
      @close="closeDialog"
      :title="
        dialogKind === 'confirm'
          ? (pendingConfirmation?.title ?? 'Konfirmasi tindakan')
          : dialogKind === 'task'
            ? selectedTask
              ? 'Detail task'
              : 'Buat task baru'
            : 'Tinjau hasil proyek'
      "
      :subtitle="
        dialogKind === 'confirm'
          ? ''
          : dialogKind === 'task'
            ? selectedTask?.title
            : 'Periksa hasil sebelum menutup siklus kerja.'
      "
      :size="dialogKind === 'confirm' ? 'sm' : 'lg'"
      :mobile-fullscreen="dialogKind !== 'confirm'"
      :primary-label="
        dialogKind === 'confirm'
          ? (pendingConfirmation?.confirmLabel ?? 'Konfirmasi')
          : dialogKind === 'task'
            ? selectedTask
              ? taskIsClosed
                ? 'Tutup detail'
                : 'Simpan perubahan'
              : 'Buat task'
            : 'Tutup proyek'
      "
      secondary-label="Batal"
      :primary-variant="
        dialogKind === 'confirm'
          ? (pendingConfirmation?.variant ?? 'primary')
          : 'primary'
      "
      :primary-disabled="
        dialogKind === 'confirm'
          ? !pendingConfirmation
          : dialogKind === 'task'
            ? taskIsClosed ? false : !taskForm.title.trim()
            : !canClose || !resultSummary.trim()
      "
      @on-primary-click="
        dialogKind === 'confirm'
          ? confirmPendingAction()
          : dialogKind === 'task'
            ? saveTask()
            : submitProjectClosure()
      "
      @on-secondary-click="
        dialogKind === 'confirm' ? cancelConfirmation() : closeDialog()
      "
    >
      <WorkspaceConfirmationDialog
        v-if="dialogKind === 'confirm'"
        :context="confirmationDialogContext"
      />
      <WorkspaceTaskDialog
        v-if="dialogKind === 'task'"
        :context="taskDialogContext"
        @comment-submit="submitTaskComment"
        @delete-task="deleteSelectedTask"
        @close-task="submitTaskClosure"
      />
      <WorkspaceProjectCloseDialog
        v-else-if="dialogKind === 'close-project'"
        :context="projectCloseDialogContext"
      />
    </OrganismModal>
  </div>
</template>
