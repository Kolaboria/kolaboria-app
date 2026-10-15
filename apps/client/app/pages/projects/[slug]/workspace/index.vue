<script setup lang="ts">
import { projectWorkspacePath } from "~/utils/workspace-paths";

const route = useRoute();
const projectSlug = String(route.params.slug ?? "");

await navigateTo(projectWorkspacePath(projectSlug), {
  replace: true,
});
</script>

<template>
  <span />
</template>
