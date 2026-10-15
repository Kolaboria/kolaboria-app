<script setup lang="ts">
import { computed } from 'vue'
import WorkspaceDiscussionView from '~/components/workspace/views/WorkspaceDiscussionView.vue'

definePageMeta({ layout: 'workspace' })

const route = useRoute()
const projectSlug = computed(() => String(route.params.slug ?? ''))
</script>

<template>
  <WorkspaceDiscussionView :project-slug="projectSlug" />
</template>
