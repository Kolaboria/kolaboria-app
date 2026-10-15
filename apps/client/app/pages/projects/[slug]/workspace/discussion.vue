<script setup lang="ts">
import { projectWorkspacePath } from '~/utils/workspace-paths'

const route = useRoute()
await navigateTo(projectWorkspacePath(String(route.params.slug ?? ''), 'discussion'), { replace: true })
</script>

<template>
  <span />
</template>
