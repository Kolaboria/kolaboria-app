<script setup lang="ts">
import WorkspaceTasksView from "~/components/workspace/views/WorkspaceTasksView.vue";
import { useWorkspaceRouteContext } from "~/composables/workspace-route-context";

const { controller, views } = useWorkspaceRouteContext();
</script>

<template>
  <WorkspaceTasksView
    :context="views.tasks"
    @filter-change="controller.setTaskFilter"
    @open-task="controller.openTask"
    @assignee-filter="controller.filterTasksByAssignee"
    @clear-assignee-filter="controller.assigneeFilter.value = null"
    @create-task="controller.openNewTask"
    @search-change="controller.searchQuery.value = $event"
    @task-status-change="controller.moveTaskFromBoard"
  />
</template>
