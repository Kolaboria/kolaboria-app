<script setup lang="ts">
import WorkspaceTeamView from "~/components/workspace/views/WorkspaceTeamView.vue";
import { useWorkspaceRouteContext } from "~/composables/workspace-route-context";

const { controller, views } = useWorkspaceRouteContext();
</script>

<template>
  <WorkspaceTeamView
    :context="views.team"
    @member-tasks="controller.goToPersonTasks"
    @task-access-change="controller.confirmTaskAccessChange"
  />
</template>
