<script setup lang="ts">
import { computed } from "vue";
import WorkspaceProjectInfoView from "~/components/workspace/views/WorkspaceProjectInfoView.vue";
import { useWorkspaceProjectInfo } from "~/composables/useWorkspaceProjectInfo";
import { useWorkspaceRouteContext } from "~/composables/workspace-route-context";

const { views } = useWorkspaceRouteContext();
const route = useRoute();
const slug = computed(() => String(route.params.slug ?? ""));
const {
  data,
  loading,
  error,
  confirmingStart,
  starting,
  startError,
  load,
  requestStart,
  confirmStart,
  cancelStart,
} = useWorkspaceProjectInfo(slug);
</script>

<template>
  <WorkspaceProjectInfoView
    :info="data"
    :context="views.info"
    :loading="loading"
    :error="error"
    :confirming-start="confirmingStart"
    :starting="starting"
    :start-error="startError"
    @retry="load"
    @start-request="requestStart"
    @start-confirm="confirmStart"
    @start-cancel="cancelStart"
  />
</template>
