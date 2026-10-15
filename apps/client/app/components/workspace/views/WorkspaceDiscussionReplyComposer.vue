<script setup lang="ts">
defineProps<{
  modelValue: string
  heading: string
  placeholder: string
  pending?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
  cancel: []
}>()
</script>

<template>
  <form
    data-inline-reply-composer
    class="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 sm:p-4"
    :aria-label="heading"
    @submit.prevent="emit('submit')"
  >
    <div>
      <h3 class="font-label-2 text-secondary-900">{{ heading }}</h3>
      <MoleculeTextarea
        label="Isi balasan"
        :model-value="modelValue"
        :placeholder="placeholder"
        :rows="3"
        :maxlength="2000"
        show-counter
        class="mt-2"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p class="font-body-3 text-neutral-500">Balasan terlihat oleh anggota proyek.</p>
      <div class="flex items-center justify-end gap-4">
        <AtomicButton
          variant="text-button"
          size="sm"
          class="min-h-11"
          :disabled="pending"
          @click="emit('cancel')"
        >
          Batal
        </AtomicButton>
        <AtomicButton
          variant="primary"
          size="sm"
          type="submit"
          :disabled="pending || !modelValue.trim()"
          class="min-h-11"
        >
          {{ pending ? 'Mengirim…' : 'Kirim balasan' }}
        </AtomicButton>
      </div>
    </div>
  </form>
</template>
