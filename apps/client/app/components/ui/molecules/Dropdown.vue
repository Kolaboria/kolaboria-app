<template>
  <div class="flex flex-col gap-1.5" ref="dropdownRef">
    <label v-if="label" class="font-label-1">
      {{ label }}
      <span v-if="multiple && max" class="font-label-2 text-secondary ml-1"
        >(maks {{ max }})</span
      >
      <span v-if="required" class="text-primary-400 font-label-1 leading-none"
        >*</span
      >
    </label>

    <div class="relative" ref="triggerRef">
      <div
        class="flex min-h-[44px] w-full flex-wrap items-center gap-1.5 rounded-lg border bg-white px-3 py-2 transition-all duration-150 focus:outline-none"
        :tabindex="disabled ? -1 : 0"
        role="combobox"
        aria-haspopup="listbox"
        :aria-expanded="isOpen"
        :aria-controls="isOpen ? listId : undefined"
        :aria-label="label || placeholder"
        :aria-disabled="disabled || undefined"
        :class="[
          error
            ? 'border-red-300 focus-within:border-red-500 focus:border-red-500'
            : 'border-neutral-300 hover:border-primary-300 focus-within:border-primary-500 focus:border-primary-500',
          disabled
            ? 'cursor-not-allowed border-neutral-300 bg-neutral-200! text-neutral-500 opacity-100 focus-within:border-neutral-300 focus:border-neutral-300'
            : ''
        ]"
        @click="toggleDropdown"
        @keydown="handleKeydown"
      >
        <!-- Single Value Mode -->
        <template v-if="!multiple">
          <div class="relative flex-1 flex items-center h-full min-h-[24px]">
            <span
              v-if="!searchable || !isOpen"
              class="absolute inset-0 flex items-center truncate pl-1"
              :class="
                disabled
                  ? 'text-neutral-500'
                  : !selectedSingle
                    ? 'text-neutral-400'
                    : 'text-neutral-900'
              "
              style="pointer-events: none"
            >
              {{ selectedSingle ? selectedSingle.label : placeholder }}
            </span>

            <input
              v-if="searchable"
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="w-full border-none bg-transparent p-0 pl-1 text-sm focus:outline-none focus:ring-0 placeholder:text-neutral-400"
              :class="[
                { 'opacity-0': !isOpen },
                disabled ? 'text-neutral-500' : 'text-neutral-900'
              ]"
              :placeholder="selectedSingle ? selectedSingle.label : placeholder"
              :disabled="disabled"
              @focus="handleFocus"
              @click.stop="
                () => {
                  if (!isOpen) toggleDropdown()
                }
              "
            />
          </div>
        </template>

        <!-- Multiple Value Mode -->
        <template v-else>
          <!-- Selected Chips -->
          <span
            v-for="val in selectedMultipleValues"
            :key="String(val)"
            class="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-600/20"
          >
            {{ getOptionLabel(val) }}
            <button
              type="button"
              @click.stop="removeOption(val)"
              class="group -mr-1 flex h-4 w-4 items-center justify-center rounded-sm hover:bg-primary-200/50"
            >
              <Icon name="lucide:x" class="h-3 w-3 text-primary-600 group-hover:text-primary-800" />
            </button>
          </span>

          <!-- Search Input for Multiple Mode -->
          <input
            v-if="searchable"
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="
              selectedMultipleValues.length === 0 ? placeholder : ''
            "
            :disabled="
              disabled || (max ? selectedMultipleValues.length >= max : false)
            "
            class="flex-1 min-w-[80px] border-none bg-transparent p-0 text-sm focus:outline-none focus:ring-0 ml-1"
            @focus="handleFocus"
            @keydown.delete="handleBackspace"
            @click.stop="
              () => {
                if (!isOpen) toggleDropdown()
              }
            "
          />
          <span
            v-else-if="selectedMultipleValues.length === 0"
            class="text-neutral-400 pl-1"
            >{{ placeholder }}</span
          >
        </template>

        <Icon name="lucide:chevron-down" class="h-5 w-5 text-neutral-400 transition-transform duration-200 ml-auto" :class="{ 'rotate-180 text-primary-400': isOpen }" aria-hidden="true" />
      </div>
      <Teleport to="body" :disabled="props.teleport === false">
        <transition
          enter-active-class="transition-all ease-out duration-150"
          :enter-from-class="openUpward ? 'transform opacity-0 translate-y-3' : 'transform opacity-0 -translate-y-3'"
          enter-to-class="transform opacity-100 translate-y-0"
          leave-active-class="transition-all ease-in duration-150"
          leave-from-class="transform opacity-100 translate-y-0"
          :leave-to-class="openUpward ? 'transform opacity-0 translate-y-3' : 'transform opacity-0 -translate-y-3'"
        >
          <div
            v-if="isOpen && !disabled"
            ref="dropdownListRef"
            class="fixed z-[9999] max-h-60 overflow-auto rounded-xl bg-white shadow-lg shadow-secondary-900/10 ring-1 ring-black/5 focus:outline-none flex flex-col"
            :style="dropdownStyle"
            @keydown="handleKeydown"
          >
            <ul :id="listId" role="listbox" class="py-1.5 flex-1 overflow-y-auto">
              <!-- Loading Skeleton -->
              <template v-if="loading">
                <li
                  v-for="i in 3"
                  :key="i"
                  class="py-2.5 px-4 flex items-center gap-3"
                >
                  <div
                    class="h-4 w-4 bg-neutral-100 animate-pulse rounded-sm"
                    v-if="multiple"
                  ></div>
                  <div
                    class="h-4 w-full bg-neutral-100 animate-pulse rounded-md"
                  ></div>
                </li>
              </template>

              <template v-else>
                <li
                  v-for="(option, index) in filteredOptions"
                  :key="String(option.value)"
                  @click.stop="selectOption(option)"
                  class="relative cursor-pointer select-none py-2.5 pl-4 pr-9 text-sm text-neutral-800 transition-colors border-l-2"
                  :class="[
                    isSelected(option)
                      ? 'bg-primary-50 text-primary-700 font-medium border-primary-500'
                      : 'border-transparent hover:bg-neutral-50 hover:text-neutral-900 hover:border-primary-300',
                    multiple &&
                    max &&
                    selectedMultipleValues.length >= max &&
                    !isSelected(option)
                      ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:border-transparent hover:text-neutral-800'
                      : ''
                  ]"
                  role="option"
                  tabindex="-1"
                  @focus="activeOptionIndex = index"
                  @mousedown.prevent
                  :aria-selected="isSelected(option)"
                >
                  <span class="block truncate">{{ option.label }}</span>
                  <span
                    v-if="isSelected(option)"
                    class="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-500"
                  >
                    <Icon name="lucide:check" class="h-5 w-5" aria-hidden="true" />
                  </span>
                </li>
                <li
                  v-if="filteredOptions.length === 0"
                  class="py-3 px-4 text-sm text-neutral-500 text-center"
                >
                  Opsi tidak ditemukan
                </li>
              </template>
            </ul>
          </div>
        </transition>
      </Teleport>
      </div>
      <div v-if="error" class="flex items-center gap-1.5 mt-0.5">
        <Icon name="lucide:circle-alert" class="h-3.5 w-3.5 text-red-500 shrink-0" aria-hidden="true" />
        <span class="font-body-3 text-red-500">{{ error }}</span>
      </div>
      <span v-else-if="hint" class="font-body-3 text-secondary mt-1">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, useId, watch } from 'vue'

interface Option {
  label: string
  value: string | number
}

// Props supporting both Single and Multiple modes
const props = withDefaults(
  defineProps<{
    label?: string
    modelValue?: string | number | (string | number)[] | null
    options: Option[]
    placeholder?: string
    error?: string
    hint?: string
    disabled?: boolean
    required?: boolean
    multiple?: boolean
    searchable?: boolean
    max?: number
    loading?: boolean
    selectedValues?: (string | number)[]
    teleport?: boolean
  }>(),
  {
    teleport: true
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number | (string | number)[] | null]
  open: []
}>()

const isOpen = ref(false)
const hasOpened = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownListRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const listId = useId()
const activeOptionIndex = ref(0)
const searchQuery = ref('')
const openUpward = ref(false)
const dropdownStyle = ref<Record<string, string>>({})

// Computed values
const selectedSingle = computed(() => {
  if (props.multiple) return null
  if (props.modelValue === null || props.modelValue === undefined) return null
  return props.options.find((opt) => opt.value === props.modelValue) || null
})

const selectedMultipleValues = computed(() => {
  if (!props.multiple) return []
  return (Array.isArray(props.modelValue) ? props.modelValue : []) as (
    | string
    | number
  )[]
})

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) return props.options
  const query = searchQuery.value.toLowerCase()
  return props.options.filter((opt) => opt.label.toLowerCase().includes(query))
})

// Methods
const getOptionLabel = (value: string | number) => {
  return props.options.find((opt) => opt.value === value)?.label || value
}

const isSelected = (option: Option) => {
  if (props.selectedValues?.includes(option.value)) {
    return true
  }
  if (props.multiple) {
    return selectedMultipleValues.value.includes(option.value)
  }
  return option.value === props.modelValue
}

const DROPDOWN_MAX_HEIGHT = 240
const DROPDOWN_GAP = 4
const DROPDOWN_VIEWPORT_PADDING = 8

const calculatePosition = () => {
  if (!triggerRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const spaceBelow = Math.max(
    0,
    window.innerHeight - triggerRect.bottom - DROPDOWN_GAP - DROPDOWN_VIEWPORT_PADDING
  )
  const spaceAbove = Math.max(
    0,
    triggerRect.top - DROPDOWN_GAP - DROPDOWN_VIEWPORT_PADDING
  )
  const optionRowHeight = 40
  const contentHeight = props.loading
    ? 120
    : filteredOptions.value.length > 0
      ? Math.min(filteredOptions.value.length * optionRowHeight + 12, DROPDOWN_MAX_HEIGHT)
      : 56

  openUpward.value = spaceBelow < contentHeight && spaceAbove > spaceBelow
  const availableHeight = openUpward.value ? spaceAbove : spaceBelow
  const maxHeight = Math.min(DROPDOWN_MAX_HEIGHT, availableHeight)
  const isLocalPosition = props.teleport === false

  dropdownStyle.value = {
    position: isLocalPosition ? 'absolute' : 'fixed',
    left: isLocalPosition ? '0' : `${triggerRect.left}px`,
    width: isLocalPosition ? '100%' : `${triggerRect.width}px`,
    zIndex: '9999',
    maxHeight: `${maxHeight}px`,
    ...(openUpward.value
      ? isLocalPosition
        ? { bottom: `calc(100% + ${DROPDOWN_GAP}px)` }
        : { bottom: `${window.innerHeight - triggerRect.top + DROPDOWN_GAP}px` }
      : isLocalPosition
        ? { top: `calc(100% + ${DROPDOWN_GAP}px)` }
        : { top: `${triggerRect.bottom + DROPDOWN_GAP}px` })
  }
}

const handleFocus = () => {
  if (!isOpen.value && !props.disabled) {
    toggleDropdown()
  }
}

const toggleDropdown = () => {
  if (props.disabled) return
  const shouldOpen = !isOpen.value

  if (shouldOpen) {
    calculatePosition()
    isOpen.value = true
    activeOptionIndex.value = Math.max(0, filteredOptions.value.findIndex(isSelected))
    if (!hasOpened.value) {
      hasOpened.value = true
      emit('open')
    }
    nextTick(() => {
      calculatePosition()
      if (props.searchable) {
        searchInputRef.value?.focus()
        calculatePosition()
      }
    })
  } else {
    isOpen.value = false
    searchQuery.value = ''
  }
}

const focusActiveOption = async () => {
  await nextTick()
  const option = dropdownListRef.value?.querySelectorAll<HTMLElement>('[role="option"]')[activeOptionIndex.value]
  option?.focus({ preventScroll: true })
  option?.scrollIntoView({ block: 'nearest' })
}

const focusTrigger = () => {
  const trigger = triggerRef.value?.firstElementChild
  if (trigger instanceof HTMLElement) trigger.focus()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    event.stopPropagation()
    isOpen.value = false
    searchQuery.value = ''
    focusTrigger()
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    event.stopPropagation()
    if (!isOpen.value) toggleDropdown()
    else activeOptionIndex.value = Math.max(0, Math.min(
      activeOptionIndex.value + (event.key === 'ArrowDown' ? 1 : -1),
      filteredOptions.value.length - 1
    ))
    void focusActiveOption()
    return
  }
  const isTyping = event.target instanceof HTMLInputElement
  if (event.key === 'Enter' || (event.key === ' ' && !isTyping)) {
    event.preventDefault()
    event.stopPropagation()
    if (!isOpen.value) toggleDropdown()
    else {
      const option = filteredOptions.value[activeOptionIndex.value]
      if (option) {
        selectOption(option)
        if (!props.multiple) focusTrigger()
      }
    }
  }
  if (event.key === 'Tab') {
    isOpen.value = false
    searchQuery.value = ''
  }
}

watch(filteredOptions, async options => {
  activeOptionIndex.value = Math.max(0, options.findIndex(isSelected))
  if (isOpen.value) {
    await nextTick()
    calculatePosition()
  }
})
watch(() => props.loading, async () => {
  if (isOpen.value) {
    await nextTick()
    calculatePosition()
  }
})
watch(() => props.disabled, disabled => {
  if (disabled) {
    isOpen.value = false
    searchQuery.value = ''
  }
})

const selectOption = (option: Option) => {
  if (props.disabled) return

  if (props.multiple) {
    const currentValues = [...selectedMultipleValues.value]
    const index = currentValues.indexOf(option.value)

    if (index > -1) {
      currentValues.splice(index, 1) // Remove
    } else {
      if (props.max && currentValues.length >= props.max) return // Limit reached
      currentValues.push(option.value) // Add
    }

    emit('update:modelValue', currentValues)
    searchQuery.value = ''
    searchInputRef.value?.focus()
  } else {
    emit('update:modelValue', option.value)
    isOpen.value = false
    searchQuery.value = ''
  }
}

const removeOption = (value: string | number) => {
  if (props.disabled || !props.multiple) return
  const currentValues = selectedMultipleValues.value.filter((v) => v !== value)
  emit('update:modelValue', currentValues)
}

const handleBackspace = () => {
  if (
    props.multiple &&
    searchQuery.value === '' &&
    selectedMultipleValues.value.length > 0
  ) {
    const currentValues = [...selectedMultipleValues.value]
    currentValues.pop()
    emit('update:modelValue', currentValues)
  }
}

// Click outside to close
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  const isOutsideDropdown =
    dropdownRef.value && !dropdownRef.value.contains(target)
  const isOutsideList =
    dropdownListRef.value && !dropdownListRef.value.contains(target)

  if (isOutsideDropdown && isOutsideList) {
    isOpen.value = false
    searchQuery.value = ''
  }
}

const handleScrollOrResize = () => {
  if (isOpen.value) {
    calculatePosition()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  window.addEventListener('scroll', handleScrollOrResize, true)
  window.addEventListener('resize', handleScrollOrResize)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('scroll', handleScrollOrResize, true)
  window.removeEventListener('resize', handleScrollOrResize)
})
</script>
