<template>
  <span
    class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!"
    :class="variantClasses"
  >
    <slot>{{ label }}</slot>
    <button
      v-if="closable"
      type="button"
      data-icon="inline-end"
      class="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      :class="focusRingClass"
      :aria-label="resolvedCloseLabel"
      @click.stop="emit('close')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="h-3 w-3"
      >
        <path
          d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
        />
      </svg>
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label?: string
  closeLabel?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  closable?: boolean
}>()
const resolvedCloseLabel = computed(() => props.closeLabel || 'Close tag')

const emit = defineEmits<{
  close: []
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-primary-100 text-primary-800 border border-primary-300'
    case 'success':
      return 'bg-success-50 text-success-700 border border-success-200'
    case 'warning':
      return 'bg-accent-100 text-accent-900 border border-accent-300'
    case 'danger':
      return 'bg-danger-50 text-danger-700 border border-danger-200'
    case 'default':
    default:
      return 'bg-neutral-50 text-neutral-600 border border-neutral-200'
  }
})

const focusRingClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'focus-visible:ring-primary-400'
    case 'success':
      return 'focus-visible:ring-success-500'
    case 'warning':
      return 'focus-visible:ring-accent-400'
    case 'danger':
      return 'focus-visible:ring-danger-500'
    default:
      return 'focus-visible:ring-neutral-400'
  }
})
</script>
