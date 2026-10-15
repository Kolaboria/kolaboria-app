<script setup lang="ts">
import WorkspaceOverviewView from "~/components/workspace/views/WorkspaceOverviewView.vue";
import { useWorkspaceRouteContext } from "~/composables/workspace-route-context";

const { controller, views } = useWorkspaceRouteContext();
</script>

<template>
  <WorkspaceOverviewView
    :context="views.overview"
    @view-change="controller.goToView"
    @filter-change="controller.setTaskFilter"
    @open-task="controller.openTask"
    @member-tasks="controller.goToPersonTasks"
  />
</template>
