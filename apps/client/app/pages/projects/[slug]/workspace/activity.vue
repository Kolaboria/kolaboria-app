<script setup lang="ts">
import WorkspaceActivityView from "~/components/workspace/views/WorkspaceActivityView.vue";
import { useWorkspaceRouteContext } from "~/composables/workspace-route-context";

const { views } = useWorkspaceRouteContext();
</script>

<template>
  <WorkspaceActivityView :context="views.activity" />
</template>
