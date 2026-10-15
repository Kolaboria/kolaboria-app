import { computed, reactive, ref, watch } from "vue";
import type { ComputedRef } from "vue";
import type { Component } from "vue";
import {
  History,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Settings2,
  UsersRound,
} from "@lucide/vue";

import {
  personFor,
  toggleWorkspaceAssigneeFilter,
  type WorkspacePrototypeProject,
  type WorkspacePrototypeTask,
  type WorkspacePrototypeTaskStatus,
  type WorkspacePrototypeReadiness,
} from "~/utils/workspace-prototype-state";
import { useWorkspacePrototype } from "~/composables/useWorkspacePrototype";
import {
  contributionLabel,
  contributionTone,
  dateLabel,
  priorityLabel,
  readinessLabel,
  shortDate,
  taskStatusLabel,
  taskStatusTone,
  timeLabel,
} from "~/utils/workspace-presentation";
import { projectWorkspacePath } from "~/utils/workspace-paths";

export const useWorkspaceController = () => {
  type WorkspaceView =
    | "overview"
    | "tasks"
    | "team"
    | "discussion"
    | "activity"
    | "info";
  type TaskFilter = "all" | "mine" | "review";
  type DialogKind = "task" | "discussion" | "close-project" | "confirm" | null;
  type ConfirmationAction = {
    title: string;
    description: string;
    confirmLabel: string;
    variant: "primary" | "danger";
    action: () => boolean | void;
    returnTo?: "task" | "close-project";
  };

  const route = useRoute();
  const router = useRouter();

  const {
    state,
    activeProject,
    currentUser,
    isOwner,
    isProjectManager,
    canManageTasks,
    taskGroups,
    activeTaskCount,
    completedTaskCount,
    progress,
    reviewCount,
    canClose,
    notice,
    switchProject,
    switchPerson,
    changeReadiness,
    startProject,
    moveTask,
    closeTask,
    addTask,
    removeTask,
    grantTaskManagement,
    commentOnTask,
    startDiscussion,
    replyToDiscussion,
    finishProject,
    proposeContributions,
    reviewContribution,
    shareContribution,
    stopSharingContribution,
  } = useWorkspacePrototype();

  const views: Array<{
    id: WorkspaceView;
    label: string;
    description: string;
    icon: Component;
  }> = [
    {
      id: "overview",
      label: "Ringkasan",
      description: "Pantau progres dan lanjutkan kolaborasi dari satu tempat.",
      icon: LayoutDashboard,
    },
    {
      id: "tasks",
      label: "Tugas & Kanban",
      description: "Kelola pekerjaan, tanggung jawab, dan review dalam satu alur.",
      icon: ListChecks,
    },
    {
      id: "team",
      label: "Tim",
      description: "Lihat peran dan pembagian pekerjaan tim proyek.",
      icon: UsersRound,
    },
    {
      id: "discussion",
      label: "Diskusi",
      description: "Simpan keputusan dan pertanyaan penting terkait proyek.",
      icon: MessagesSquare,
    },
    {
      id: "activity",
      label: "Aktivitas",
      description: "Jejak perubahan task dan kolaborasi dalam proyek.",
      icon: History,
    },
    {
      id: "info",
      label: "Informasi proyek",
      description: "Konteks proyek dan target utama untuk seluruh anggota.",
      icon: Settings2,
    },
  ];
  const workspaceViewIds = new Set<WorkspaceView>([
    "overview",
    "tasks",
    "team",
    "discussion",
    "activity",
    "info",
  ]);
  const activeView = computed<WorkspaceView>(() => {
    const routeSegments = route.path.split("/workspace/")[1]?.split("/") ?? [];
    const routeView = routeSegments[0] === "discussions" ? "discussion" : routeSegments[0];
    return routeView && workspaceViewIds.has(routeView as WorkspaceView)
      ? (routeView as WorkspaceView)
      : "overview";
  });
  const mobileMoreOpen = ref(false);
  const taskFilter = ref<TaskFilter>("all");
  const assigneeFilter = ref<string | null>(null);
  const searchQuery = ref("");
  const selectedTaskId = ref<string | null>(null);
  const dialogOpen = ref(false);
  const dialogKind = ref<DialogKind>(null);
  const taskError = ref("");
  const discussionError = ref("");
  const outcomeError = ref("");
  const pendingConfirmation = ref<ConfirmationAction | null>(null);
  const taskForm = reactive({
    title: "",
    description: "",
    assigneeId: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
    status: "todo" as WorkspacePrototypeTaskStatus,
    comment: "",
    closeReason: "",
  });
  const discussionForm = reactive({ title: "", body: "" });
  const resultSummary = ref("");
  const contributionNotes = reactive<Record<string, string>>({});

  const taskStatuses: Array<{
    value: Exclude<WorkspacePrototypeTaskStatus, "closed" | "cancelled">;
    label: string;
  }> = [
    { value: "todo", label: "Akan dikerjakan" },
    { value: "doing", label: "Dikerjakan" },
    { value: "review", label: "Perlu review" },
    { value: "done", label: "Selesai" },
  ];
  const readinessOptions = [
    { value: "ready", label: "Siap" },
    { value: "to_fill", label: "Masih perlu diisi" },
    { value: "not_needed", label: "Tidak diperlukan" },
  ];

  const currentProject = computed(
    () => activeProject.value as WorkspacePrototypeProject | null,
  );
  const selectedTask = computed(
    () =>
      currentProject.value?.tasks.find(
        (task) => task.id === selectedTaskId.value,
      ) ?? null,
  );
  const taskReadOnly = computed(() =>
    Boolean(
      selectedTask.value &&
      !isProjectManager.value,
    ),
  );
  const taskIsClosed = computed(
    () =>
      selectedTask.value?.status === "closed" ||
      selectedTask.value?.status === "cancelled",
  );
  const projectOwner = computed(() =>
    currentProject.value
      ? personFor(state.value, currentProject.value.ownerId)
      : null,
  );
  const viewerRoleLabel = computed(() =>
    isOwner.value ? "Project Owner" : "Contributor",
  );
  const projectMembers = computed(
    () =>
      currentProject.value?.memberIds
        .map((id) => personFor(state.value, id))
        .filter((person) => person !== null) ?? [],
  );
  const assigneeOptions = computed(() => [
    { label: "Belum ditentukan", value: "" },
    ...projectMembers.value.map((person) => ({
      label: person.name,
      value: person.id,
    })),
  ]);
  const visibleTaskGroups = computed(() => {
    const query = searchQuery.value.trim().toLocaleLowerCase("id-ID");
    const filterTask = (tasks: WorkspacePrototypeTask[]) =>
      tasks.filter((task) => {
        const matchesSearch =
          !query ||
          `${task.title} ${task.description}`
            .toLocaleLowerCase("id-ID")
            .includes(query);
        const matchesAssignee =
          !assigneeFilter.value || task.assigneeId === assigneeFilter.value;
        const matchesFilter =
          taskFilter.value === "all" ||
          (taskFilter.value === "mine" &&
            task.assigneeId === state.value.currentUserId) ||
          (taskFilter.value === "review" && task.status === "review");
        return matchesSearch && matchesAssignee && matchesFilter;
      });
    return {
      todo: filterTask(taskGroups.value.todo),
      doing: filterTask(taskGroups.value.doing),
      review: filterTask(taskGroups.value.review),
      done: filterTask(taskGroups.value.done),
      closed: filterTask(taskGroups.value.closed),
    };
  });
  const myTasks = computed(
    () =>
      currentProject.value?.tasks.filter(
        (task) =>
          task.assigneeId === state.value.currentUserId &&
          task.status !== "closed" &&
          task.status !== "cancelled",
      ) ?? [],
  );
  const myActiveTasks = computed(() =>
    myTasks.value.filter((task) => task.status !== "done"),
  );
  const openTasks = computed(
    () =>
      currentProject.value?.tasks.filter(
        (task) => !["done", "closed", "cancelled"].includes(task.status),
      ) ?? [],
  );
  const closedTasks = computed(() => taskGroups.value.closed);
  const myContribution = computed(
    () =>
      currentProject.value?.contributions.find(
        (record) => record.contributorId === state.value.currentUserId,
      ) ?? null,
  );
  const statusLabel = computed(
    () =>
      ({ preparing: "Persiapan", in_progress: "Berjalan", completed: "Selesai" })[
        currentProject.value?.status ?? "preparing"
      ],
  );
  const activeTitle = computed(
    () =>
      ({
        overview: "Ringkasan workspace",
        tasks: "Tugas & Kanban",
        team: "Tim proyek",
        discussion: "Diskusi proyek",
        activity: "Riwayat aktivitas",
        info: "Informasi proyek",
      })[activeView.value],
  );
  const activeDescription = computed(
    () => views.find((view) => view.id === activeView.value)?.description ?? "",
  );

  const goToView = (view: WorkspaceView) => {
    mobileMoreOpen.value = false;
    if (view !== "tasks") assigneeFilter.value = null;
    const projectSlug = String(route.params.slug ?? "");
    return router.push(projectWorkspacePath(projectSlug, view));
  };

  const goToPersonTasks = (personId: string) => {
    assigneeFilter.value = personId;
    taskFilter.value = "all";
    goToView("tasks");
  };

  const filterTasksByAssignee = (personId: string) => {
    assigneeFilter.value = toggleWorkspaceAssigneeFilter(
      assigneeFilter.value,
      personId,
    );
  };

  const setTaskFilter = (filter: TaskFilter) => {
    taskFilter.value = filter;
    assigneeFilter.value = null;
  };

  const canDragTask = (task: WorkspacePrototypeTask) =>
    currentProject.value?.status === "in_progress" &&
    task.status !== "cancelled" &&
    (isProjectManager.value || task.assigneeId === state.value.currentUserId);

  const moveTaskFromBoard = (
    taskId: string,
    status: Exclude<WorkspacePrototypeTaskStatus, "cancelled">,
  ) => {
    const task = currentProject.value?.tasks.find((item) => item.id === taskId);
    if (!task || task.status === status || !canDragTask(task)) return false;

    if (status === "closed") {
      if (
        !isProjectManager.value ||
        ["done", "closed", "cancelled"].includes(task.status)
      )
        return false;
      openTask(task);
      return false;
    }

    const isReopening = task.status === "closed";
    if (isReopening) {
      requestConfirmation({
        title: "Buka kembali task?",
        description: `“${task.title}” akan kembali ke alur kerja dan alasan penutupan scope akan dihapus.`,
        confirmLabel: "Buka kembali task",
        variant: "primary",
        action: () => moveTask(taskId, status),
      });
      return false;
    }

    return moveTask(taskId, status);

  };

  const setContributionNote = (contributionId: string, value: string) => {
    contributionNotes[contributionId] = value;
  };

  const openTask = (task: WorkspacePrototypeTask) => {
    if (activeView.value !== "tasks") void goToView("tasks");
    selectedTaskId.value = task.id;
    Object.assign(taskForm, {
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId ?? "",
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
      comment: "",
      closeReason: "",
    });
    taskError.value = "";
    dialogKind.value = "task";
    dialogOpen.value = true;
  };

  const openNewTask = () => {
    if (!canManageTasks.value || currentProject.value?.status !== "in_progress")
      return;
    selectedTaskId.value = null;
    Object.assign(taskForm, {
      title: "",
      description: "",
      assigneeId: isProjectManager.value ? "" : state.value.currentUserId,
      priority: "medium",
      dueDate: "",
      status: "todo",
      comment: "",
      closeReason: "",
    });
    taskError.value = "";
    dialogKind.value = "task";
    dialogOpen.value = true;
  };

  const closeDialog = () => {
    dialogKind.value = null;
    dialogOpen.value = false;
    pendingConfirmation.value = null;
    taskError.value = "";
    discussionError.value = "";
    outcomeError.value = "";
  };

  const requestConfirmation = (confirmation: ConfirmationAction) => {
    pendingConfirmation.value = confirmation;
    dialogKind.value = "confirm";
    dialogOpen.value = true;
  };

  const cancelConfirmation = () => {
    const returnTo = pendingConfirmation.value?.returnTo;
    pendingConfirmation.value = null;
    if (returnTo) {
      dialogKind.value = returnTo;
      dialogOpen.value = true;
    } else {
      closeDialog();
    }
  };

  const confirmPendingAction = () => {
    const confirmation = pendingConfirmation.value;
    if (!confirmation) return;
    const succeeded = confirmation.action() !== false;
    const returnTo = confirmation.returnTo;
    pendingConfirmation.value = null;
    if (!succeeded && returnTo) {
      dialogKind.value = returnTo;
      dialogOpen.value = true;
      return;
    }
    closeDialog();
  };

  const confirmTaskAccessChange = (memberId: string, enabled: boolean) => {
    const member = personFor(state.value, memberId)?.name ?? "contributor ini";
    requestConfirmation({
      title: enabled ? "Berikan izin kelola task?" : "Cabut izin kelola task?",
      description: enabled
        ? `${member} dapat membuat dan menghapus task aktif. Izin ini tidak memberi akses ke pengaturan dan penutupan proyek.`
        : `Setelah izin dicabut, ${member} tidak lagi dapat membuat atau menghapus task. Task yang sudah ada tetap tersimpan.`,
      confirmLabel: enabled ? "Berikan akses" : "Cabut akses",
      variant: enabled ? "primary" : "danger",
      action: () => grantTaskManagement(memberId, enabled),
    });
  };

  const confirmProjectStart = () => {
    requestConfirmation({
      title: "Mulai proyek sekarang?",
      description:
        "Workspace akan aktif dan tim dapat mulai mengerjakan task proyek.",
      confirmLabel: "Mulai proyek",
      variant: "primary",
      action: startProject,
    });
  };

  const confirmReadinessChange = (
    roleId: string,
    readiness: WorkspacePrototypeReadiness,
  ) => {
    if (readiness !== "not_needed") {
      changeReadiness(roleId, readiness);
      return;
    }
    const role = currentProject.value?.roleReadiness.find(
      (item) => item.id === roleId,
    );
    requestConfirmation({
      title: "Tandai peran tidak diperlukan?",
      description: `Peran ${role?.name ?? "ini"} akan dikeluarkan dari kebutuhan proyek dan tidak menghalangi proyek dimulai.`,
      confirmLabel: "Tandai tidak diperlukan",
      variant: "danger",
      action: () => changeReadiness(roleId, readiness),
    });
  };

  const persistTaskChanges = (task: WorkspacePrototypeTask, title: string) => {
    if (isProjectManager.value) {
      task.title = title;
      task.description = taskForm.description.trim();
      task.assigneeId = taskForm.assigneeId || null;
      task.priority = taskForm.priority;
      task.dueDate = taskForm.dueDate;
    }
    if (task.status !== taskForm.status) {
      if (
        !moveTask(
          task.id,
          taskForm.status as Exclude<
            WorkspacePrototypeTaskStatus,
            "cancelled" | "closed"
          >,
        )
      )
        return false;
    }
    closeDialog();
    return true;
  };

  const saveTask = () => {
    if (!currentProject.value) return;
    const title = taskForm.title.trim();
    if (!title) {
      taskError.value = "Judul task wajib diisi.";
      return;
    }
    if (!selectedTask.value) {
      const created = addTask({
        title,
        description: taskForm.description.trim(),
        assigneeId: isProjectManager.value
          ? taskForm.assigneeId || null
          : state.value.currentUserId,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate,
        status: "todo",
      });
      if (!created) return;
      closeDialog();
      return;
    }
    const task = selectedTask.value;
    if (!task) return;
    if (taskIsClosed.value && taskForm.status !== task.status) {
      requestConfirmation({
        title: "Buka kembali task?",
        description: `“${title}” akan kembali ke alur kerja. Alasan penutupan scope akan dihapus.`,
        confirmLabel: "Buka kembali task",
        variant: "primary",
        returnTo: "task",
        action: () => persistTaskChanges(task, title),
      });
      return;
    }
    persistTaskChanges(task, title);
  };

  const deleteSelectedTask = () => {
    if (!selectedTask.value) return;
    const taskId = selectedTask.value.id;
    const title = selectedTask.value.title;
    requestConfirmation({
      title: "Hapus task ini?",
      description: `“${title}” akan dihapus dari proyek dan tidak dapat dipulihkan.`,
      confirmLabel: "Hapus task",
      variant: "danger",
      returnTo: "task",
      action: () => removeTask(taskId),
    });
  };

  const submitTaskComment = () => {
    if (!selectedTask.value) return;
    if (commentOnTask(selectedTask.value.id, taskForm.comment))
      taskForm.comment = "";
  };

  const submitTaskClosure = () => {
    if (!selectedTask.value) return;
    const reason = taskForm.closeReason.trim();
    if (!reason) {
      taskError.value = "Tambahkan alasan perubahan scope sebelum menutup task.";
      return;
    }
    const taskId = selectedTask.value.id;
    requestConfirmation({
      title: "Tutup task karena perubahan scope?",
      description: `Task “${selectedTask.value.title}” akan tetap tercatat sebagai ditutup. Alasan: ${reason}`,
      confirmLabel: "Tutup task",
      variant: "danger",
      returnTo: "task",
      action: () => {
        const closed = closeTask(taskId, reason);
        if (closed) taskForm.closeReason = "";
        return closed;
      },
    });
  };

  const openDiscussionDialog = () => {
    Object.assign(discussionForm, { title: "", body: "" });
    discussionError.value = "";
    dialogKind.value = "discussion";
    dialogOpen.value = true;
  };

  const submitDiscussion = () => {
    const created = startDiscussion(discussionForm.title, discussionForm.body);
    if (!created) {
      discussionError.value = "Isi topik dan pesan diskusi terlebih dahulu.";
      return;
    }
    closeDialog();
  };

  const openCloseProjectDialog = () => {
    resultSummary.value = currentProject.value?.resultSummary ?? "";
    outcomeError.value = "";
    dialogKind.value = "close-project";
    dialogOpen.value = true;
  };

  const submitProjectClosure = () => {
    if (!canClose.value || !resultSummary.value.trim()) {
      outcomeError.value = canClose.value
        ? "Ringkasan hasil perlu diisi."
        : "Masih ada task yang belum selesai atau belum ditutup dengan alasan.";
      return;
    }
    const summary = resultSummary.value.trim();
    requestConfirmation({
      title: "Tutup proyek setelah tinjau hasil?",
      description: summary,
      confirmLabel: "Konfirmasi penutupan",
      variant: "danger",
      returnTo: "close-project",
      action: () => finishProject(summary),
    });
  };

  const confirmContributionReview = (
    contributionId: string,
    decision: "accepted" | "changes_requested",
    note = "",
  ) => {
    requestConfirmation({
      title:
        decision === "accepted"
          ? "Setujui rekam kontribusi?"
          : "Minta koreksi rekam kontribusi?",
      description:
        decision === "accepted"
          ? "Kontributor akan dapat meninjau dan memilih apakah rekam kontribusinya ingin dibagikan."
          : `Catatan koreksi akan dikirim kepada kontributor: ${note.trim()}`,
      confirmLabel:
        decision === "accepted" ? "Setujui rekam" : "Kirim permintaan koreksi",
      variant: "primary",
      action: () => reviewContribution(contributionId, decision, note),
    });
  };

  const confirmContributionSharing = (
    contributionId: string,
    enabled: boolean,
  ) => {
    requestConfirmation({
      title: enabled ? "Bagikan rekam kontribusi?" : "Tarik izin berbagi?",
      description: enabled
        ? "Rekam ini akan terlihat sebagai bagian dari profil kontribusimu. Kamu dapat menarik izin berbagi nanti."
        : "Rekam kontribusi ini akan kembali privat dan tidak ditampilkan sebagai rekam yang dibagikan.",
      confirmLabel: enabled ? "Bagikan rekam" : "Tarik izin berbagi",
      variant: "primary",
      action: () =>
        enabled
          ? shareContribution(contributionId)
          : stopSharingContribution(contributionId),
    });
  };

  const confirmContributionProposal = () => {
    requestConfirmation({
      title: "Usulkan rekam kontribusi?",
      description:
        "Rekam privat akan dibuat untuk anggota proyek yang belum memilikinya. Setiap contributor dapat meninjau rekamnya sendiri sebelum memilih untuk membagikannya.",
      confirmLabel: "Buat usulan rekam",
      variant: "primary",
      action: () => {
        proposeContributions();
      },
    });
  };

  const cycleReadiness = (roleId: string, current: WorkspacePrototypeReadiness) => {
    const next: WorkspacePrototypeReadiness =
      current === "to_fill"
        ? "ready"
        : current === "ready"
          ? "not_needed"
          : "to_fill";
    confirmReadinessChange(roleId, next);
  };

  watch(
    () => currentProject.value?.id,
    () => {
      taskFilter.value = "all";
      assigneeFilter.value = null;
      searchQuery.value = "";
    },
  );

    return {
      state,
      activeProject,
      currentUser,
      isOwner,
      isProjectManager,
      canManageTasks,
      taskGroups,
      activeTaskCount,
      completedTaskCount,
      progress,
      reviewCount,
      canClose,
      notice,
      switchProject,
      switchPerson,
      changeReadiness,
      startProject,
      moveTask,
      closeTask,
      addTask,
      removeTask,
      grantTaskManagement,
      commentOnTask,
      startDiscussion,
      replyToDiscussion,
      finishProject,
      proposeContributions,
      reviewContribution,
      shareContribution,
      stopSharingContribution,
      views,
      activeView,
      mobileMoreOpen,
      taskFilter,
      assigneeFilter,
      searchQuery,
      selectedTaskId,
      dialogOpen,
      dialogKind,
      taskError,
      discussionError,
      outcomeError,
      pendingConfirmation,
      taskForm,
      discussionForm,
      resultSummary,
      contributionNotes,
      taskStatuses,
      readinessOptions,
      currentProject,
      selectedTask,
      taskReadOnly,
      taskIsClosed,
      projectOwner,
      viewerRoleLabel,
      projectMembers,
      assigneeOptions,
      visibleTaskGroups,
      myTasks,
      myActiveTasks,
      openTasks,
      closedTasks,
      myContribution,
      statusLabel,
      activeTitle,
      activeDescription,
      goToView,
      goToPersonTasks,
      filterTasksByAssignee,
      setTaskFilter,
      canDragTask,
      moveTaskFromBoard,
      openTask,
      openNewTask,
      closeDialog,
      requestConfirmation,
      cancelConfirmation,
      confirmPendingAction,
      confirmTaskAccessChange,
      confirmProjectStart,
      confirmReadinessChange,
      persistTaskChanges,
      saveTask,
      deleteSelectedTask,
      submitTaskComment,
      submitTaskClosure,
      openDiscussionDialog,
      submitDiscussion,
      openCloseProjectDialog,
      submitProjectClosure,
      confirmContributionReview,
      confirmContributionSharing,
      confirmContributionProposal,
      setContributionNote,
      cycleReadiness,
      dateLabel,
      shortDate,
      timeLabel,
      taskStatusLabel,
      taskStatusTone,
      priorityLabel,
      readinessLabel,
      contributionLabel,
      contributionTone
    }
}

export type WorkspaceController = ReturnType<typeof useWorkspaceController>

type WorkspaceProjectViewContext<T extends { currentProject: unknown }> = Omit<
  T,
  "currentProject"
> & {
  currentProject: ComputedRef<WorkspacePrototypeProject>;
};

export type WorkspaceOverviewContext = WorkspaceProjectViewContext<Pick<
  WorkspaceController,
  | "state"
  | "currentUser"
  | "isOwner"
  | "isProjectManager"
  | "taskGroups"
  | "activeTaskCount"
  | "completedTaskCount"
  | "progress"
  | "reviewCount"
  | "currentProject"
  | "projectMembers"
  | "myActiveTasks"
  | "dateLabel"
  | "timeLabel"
  | "taskStatusLabel"
  | "taskStatusTone"
>>

export type WorkspaceTasksContext = WorkspaceProjectViewContext<Pick<
  WorkspaceController,
  | "state"
  | "canManageTasks"
  | "isProjectManager"
  | "taskFilter"
  | "canDragTask"
  | "moveTaskFromBoard"
  | "assigneeFilter"
  | "searchQuery"
  | "currentProject"
  | "projectMembers"
  | "visibleTaskGroups"
  | "shortDate"
  | "priorityLabel"
>>

export type WorkspaceTeamContext = WorkspaceProjectViewContext<Pick<
  WorkspaceController,
  | "state"
  | "isOwner"
  | "currentProject"
  | "projectMembers"
>>

export type WorkspaceDiscussionContext = WorkspaceProjectViewContext<Pick<
  WorkspaceController,
  | "state"
  | "currentProject"
  | "timeLabel"
>>

export type WorkspaceActivityContext = WorkspaceProjectViewContext<Pick<
  WorkspaceController,
  "state" | "currentProject" | "timeLabel"
>>

export type WorkspaceProjectInfoContext = Pick<
  WorkspaceController,
  | "canClose"
  | "activeTaskCount"
  | "completedTaskCount"
  | "progress"
  | "openTasks"
  | "closedTasks"
>

export type WorkspaceConfirmationDialogContext = Pick<
  WorkspaceController,
  "pendingConfirmation"
>

export type WorkspaceTaskDialogContext = Pick<
  WorkspaceController,
  | "state"
  | "currentUser"
  | "isProjectManager"
  | "selectedTask"
  | "taskReadOnly"
  | "taskIsClosed"
  | "canManageTasks"
  | "currentProject"
  | "taskForm"
  | "taskError"
  | "assigneeOptions"
  | "taskStatuses"
  | "timeLabel"
>

export type WorkspaceDiscussionDialogContext = Pick<
  WorkspaceController,
  "discussionForm" | "discussionError"
>

export type WorkspaceProjectCloseDialogContext = Pick<
  WorkspaceController,
  "completedTaskCount" | "closedTasks" | "resultSummary" | "outcomeError"
>
