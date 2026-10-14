<template>
  <component
    :is="componentType"
    :href="href"
    :type="isButton ? type : undefined"
    :disabled="isDisabled"
    :class="buttonClass"
    :title="title"
    v-bind="$attrs"
    @click="handleClick"
  >
    <Icon
      v-if="loading"
      name="lucide:loader-circle"
      class="animate-spin"
      :class="spinnerSizeClass"
      aria-hidden="true"
    />
    <span
      v-else
      class="flex items-center justify-center [&>svg]:shrink-0"
      :class="iconSizeClass"
    >
      <slot />
    </span>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const ICON_SIZE_CLASSES = {
  sm: {
    slot: '[&>svg]:size-5',
    spinner: 'size-5'
  },
  md: {
    slot: '[&>svg]:size-6',
    spinner: 'size-6'
  },
  lg: {
    slot: '[&>svg]:size-7',
    spinner: 'size-7'
  }
}

const props = defineProps({
  href: String,
  type: { type: String, default: 'button' },
  title: String,
  variant: {
    type: String,
    default: 'ghost',
    validator: (value) =>
      ['primary', 'secondary', 'outline', 'ghost', 'light'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  shape: {
    type: String,
    default: 'circle',
    validator: (value) => ['circle', 'square'].includes(value)
  },
  disabled: Boolean,
  loading: Boolean
})

const emit = defineEmits(['click'])

const isButton = computed(() => !props.href)

const componentType = computed(() => {
  if (props.href) return 'a'
  return 'button'
})

const isDisabled = computed(() => props.disabled || props.loading)

const handleClick = (event) => {
  if (!isDisabled.value) emit('click', event)
}

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 w-8'
    case 'md':
      return 'h-10 w-10'
    case 'lg':
      return 'h-12 w-12'
  }
})

const iconSizeClass = computed(() => ICON_SIZE_CLASSES[props.size]?.slot)
const spinnerSizeClass = computed(() => ICON_SIZE_CLASSES[props.size]?.spinner)

const shapeClasses = computed(() =>
  props.shape === 'circle' ? 'rounded-full' : 'rounded-lg'
)

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return `bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800`
    case 'secondary':
      return `bg-accent-400 text-secondary-800 hover:bg-accent-700 active:bg-accent-800`
    case 'outline':
      return `border border-neutral-300 bg-white text-neutral-400 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 active:bg-primary-100`
    case 'ghost':
      return `bg-transparent text-neutral-400 hover:bg-primary-50 hover:text-primary-600 active:bg-primary-100`
    case 'light':
      return `bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800 active:bg-neutral-300`
  }
})

const baseClass = `flex items-center justify-center  transition-all duration-200  focus:outline-none  cursor-pointer`

const disabledClass = `bg-neutral-100 text-neutral-300 cursor-not-allowed`

const buttonClass = computed(() => [
  baseClass,
  sizeClasses.value,
  shapeClasses.value,
  isDisabled.value ? disabledClass : variantClasses.value
])
</script>
