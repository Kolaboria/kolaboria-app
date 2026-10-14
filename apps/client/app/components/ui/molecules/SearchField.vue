<template>
  <div class="relative flex items-center w-full h-11">
    <!-- Icon Left (Search or Loading) -->
    <div
      class="absolute left-3.5 flex items-center pointer-events-none text-neutral-400"
    >
      <Icon
        name="lucide:loader-circle"
        v-if="loading"
        class="animate-spin h-5 w-5 text-primary-400"
      />
      <Icon name="lucide:search" v-else class="h-5 w-5" aria-hidden="true" />
    </div>

    <!-- Input -->
    <input
      type="text"
      v-model="localValue"
      :placeholder="placeholder"
      class="w-full h-full min-h-[44px] bg-white border border-neutral-300 hover:border-neutral-400 focus:border-primary-500 rounded-lg pl-10.5 pr-10 font-body-2 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all placeholder-neutral-400 text-neutral-800"
      v-bind="$attrs"
    />

    <!-- Clear Button -->
    <div
      v-if="localValue && !loading"
      class="absolute right-3 flex items-center text-neutral-400"
    >
      <button
        type="button"
        @click="clear"
        class="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
        aria-label="Clear search"
      >
        <Icon name="lucide:x" class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";

const MINIMUM_SEARCH_CHARACTERS = 3;
const SEARCH_DEBOUNCE_MS = 1_000;

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    loading?: boolean;
  }>(),
  {
    modelValue: "",
    placeholder: "",
    loading: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  search: [value: string];
}>();

const localValue = ref(props.modelValue);
let syncingFromParent = false;
const initialSearch = props.modelValue.trim();
let lastSearch =
  Array.from(initialSearch).length >= MINIMUM_SEARCH_CHARACTERS
    ? initialSearch
    : "";

// Keep localValue updated when prop changes from outside
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== localValue.value) {
      syncingFromParent = true;
      localValue.value = newVal || "";
      syncingFromParent = false;
    }
  },
  { flush: "sync" },
);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Keep the input model immediate; debounce only the semantic search event.
watch(
  localValue,
  (newVal) => {
    if (syncingFromParent) return;
    if (newVal !== props.modelValue) emit("update:modelValue", newVal);

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = null;

    const search = newVal.trim();
    if (Array.from(search).length < MINIMUM_SEARCH_CHARACTERS) {
      if (lastSearch) {
        lastSearch = "";
        emit("search", "");
      }
      return;
    }

    debounceTimer = setTimeout(() => {
      if (search === lastSearch) return;
      lastSearch = search;
      emit("search", search);
    }, SEARCH_DEBOUNCE_MS);
  },
  { flush: "sync" },
);

// Clean up timer on component unmount
onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
});

const clear = () => {
  localValue.value = "";
};
</script>
