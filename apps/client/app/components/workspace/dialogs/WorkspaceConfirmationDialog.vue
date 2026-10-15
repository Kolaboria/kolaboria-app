<script setup lang="ts">
import type { WorkspaceConfirmationDialogContext } from '~/composables/useWorkspaceController'

const props = defineProps<{ context: WorkspaceConfirmationDialogContext }>()
const { pendingConfirmation } = props.context
</script>

<template>
  <div
    class="rounded-xl border p-4"
    :class="
    pendingConfirmation?.variant === 'danger'
    ? 'border-danger-200 bg-danger-50 text-danger-900'
    : 'border-primary-200 bg-primary-50 text-primary-900'
    "
    >
    <p class="font-body-2">{{ pendingConfirmation?.description }}</p>
    </div>
</template>
