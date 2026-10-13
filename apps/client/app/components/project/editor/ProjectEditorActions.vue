<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, ChevronLeft, ChevronRight, Save } from '@lucide/vue'
import type {
  ProjectEditorMode,
  ProjectEditorStep
} from '~/types/project-editor'

const props = defineProps<{
  mode: ProjectEditorMode
  currentStep: ProjectEditorStep
  isSubmitting: boolean
  canPublish: boolean
  canSave?: boolean
  isDraft?: boolean
}>()

const emit = defineEmits<{
  (event: 'back'): void
  (event: 'next'): void
  (event: 'cancel'): void
  (event: 'save-draft'): void
  (event: 'save-changes'): void
  (event: 'publish'): void
}>()

const isIntermediateCreateStep = computed(
  () =>
    props.mode === 'create' && props.currentStep > 0 && props.currentStep < 4
)
const isCreateReviewStep = computed(
  () => props.mode === 'create' && props.currentStep === 4
)
const isEditStepAfterFirst = computed(
  () => props.mode === 'edit' && props.currentStep > 0
)

const goBack = () => {
  if (props.mode === 'create' && props.currentStep === 0) {
    emit('cancel')
    return
  }

  emit('back')
}
</script>

<template>
  <div
    class="sticky bottom-0 z-30 mt-auto flex flex-col-reverse gap-3 border-t border-neutral-200 bg-white p-3 sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:border sm:border-neutral-200 sm:px-6 sm:py-4 sm:!pb-4 lg:mb-5"
    style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
  >
    <AtomicButton
      v-if="mode === 'create' && currentStep === 4"
      variant="outline"
      class="!hidden sm:!inline-flex sm:!px-4 sm:!py-2"
      :disabled="isSubmitting"
      @click="goBack"
    >
      Kembali
    </AtomicButton>
    <AtomicButton
      v-if="mode === 'edit' && currentStep > 0"
      variant="outline"
      class="!hidden sm:!inline-flex sm:!px-4 sm:!py-2"
      :disabled="isSubmitting"
      @click="emit('back')"
    >
      Kembali
    </AtomicButton>

    <div
      class="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:justify-end"
      :class="
        isIntermediateCreateStep || isCreateReviewStep || isEditStepAfterFirst
          ? 'hidden sm:flex'
          : ''
      "
    >
      <AtomicButton
        v-if="mode === 'create' && currentStep < 4"
        variant="outline"
        class="!hidden sm:!inline-flex sm:!px-4 sm:!py-2"
        :disabled="isSubmitting"
        @click="goBack"
      >
        Kembali
      </AtomicButton>
      <AtomicButton
        v-if="mode === 'create'"
        variant="outline"
        :loading="isSubmitting"
        :disabled="isSubmitting || canSave === false"
        @click="emit('save-draft')"
      >
        Simpan sebagai Draft
      </AtomicButton>
      <AtomicButton
        v-if="mode === 'edit'"
        variant="outline"
        :loading="isSubmitting"
        :disabled="isSubmitting || canSave === false"
        @click="emit('save-changes')"
      >
        Simpan
      </AtomicButton>
      <AtomicButton
        v-if="mode === 'edit' && isDraft && currentStep === 4"
        variant="primary"
        :loading="isSubmitting"
        :disabled="isSubmitting || !canPublish"
        @click="emit('publish')"
      >
        Publikasikan Draft
      </AtomicButton>
      <template v-if="mode === 'create' && currentStep === 4">
        <AtomicButton
          variant="primary"
          :loading="isSubmitting"
          :disabled="isSubmitting || !canPublish"
          @click="emit('publish')"
        >
          Publikasikan Proyek
        </AtomicButton>
      </template>
      <AtomicButton
        v-else-if="currentStep < 4"
        variant="primary"
        :disabled="isSubmitting"
        :class="[
          { 'w-full sm:w-auto': mode === 'create' && currentStep === 0 },
          mode === 'create' ? 'sm:!px-4 sm:!py-2' : ''
        ]"
        @click="emit('next')"
      >
        Lanjutkan
      </AtomicButton>
    </div>

    <div
      v-if="isEditStepAfterFirst"
      class="flex w-full items-center gap-3 sm:hidden"
    >
      <AtomicIconButton
        variant="outline"
        size="md"
        shape="square"
        title="Kembali ke langkah sebelumnya"
        aria-label="Kembali ke langkah sebelumnya"
        :disabled="isSubmitting"
        @click="emit('back')"
      >
        <ChevronLeft class="!size-4" aria-hidden="true" />
      </AtomicIconButton>

      <div
        v-if="currentStep < 4"
        class="flex min-w-0 flex-1 items-center gap-3"
      >
        <AtomicButton
          variant="outline"
          class="min-w-0 flex-1 justify-center"
          :loading="isSubmitting"
          :disabled="isSubmitting || canSave === false"
          @click="emit('save-changes')"
        >
          Simpan
        </AtomicButton>
        <AtomicButton
          variant="primary"
          class="min-w-0 flex-1 justify-center"
          :disabled="isSubmitting"
          @click="emit('next')"
        >
          Lanjutkan
        </AtomicButton>
      </div>

      <div v-else class="flex min-w-0 flex-1 flex-col gap-2">
        <AtomicButton
          :variant="isDraft ? 'outline' : 'primary'"
          class="w-full justify-center"
          :loading="isSubmitting"
          :disabled="isSubmitting || canSave === false"
          @click="emit('save-changes')"
        >
          Simpan Perubahan
        </AtomicButton>
        <AtomicButton
          v-if="isDraft"
          variant="primary"
          class="w-full justify-center"
          :loading="isSubmitting"
          :disabled="isSubmitting || !canPublish"
          @click="emit('publish')"
        >
          Publikasikan Draft
        </AtomicButton>
      </div>
    </div>

    <div
      v-if="isIntermediateCreateStep"
      class="flex w-full items-center gap-3 sm:hidden"
    >
      <AtomicIconButton
        variant="outline"
        size="md"
        shape="square"
        title="Kembali ke langkah sebelumnya"
        aria-label="Kembali ke langkah sebelumnya"
        :disabled="isSubmitting"
        @click="emit('back')"
      >
        <ChevronLeft class="!size-4" aria-hidden="true" />
      </AtomicIconButton>
      <AtomicButton
        variant="outline"
        class="min-w-0 flex-1 justify-center"
        :loading="isSubmitting"
        :disabled="isSubmitting || canSave === false"
        @click="emit('save-draft')"
      >
        Simpan Draft
      </AtomicButton>
      <AtomicButton
        variant="primary"
        class="min-w-0 flex-1 justify-center"
        :disabled="isSubmitting"
        @click="emit('next')"
      >
        Lanjutkan
      </AtomicButton>
    </div>

    <div
      v-if="isCreateReviewStep"
      class="flex w-full items-center gap-3 sm:hidden"
    >
      <AtomicIconButton
        variant="outline"
        size="md"
        shape="square"
        title="Kembali ke langkah sebelumnya"
        aria-label="Kembali ke langkah sebelumnya"
        :disabled="isSubmitting"
        @click="emit('back')"
      >
        <ChevronLeft class="!size-4" aria-hidden="true" />
      </AtomicIconButton>

      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <AtomicButton
          variant="outline"
          class="w-full justify-center"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="emit('save-draft')"
        >
          Simpan sebagai Draft
        </AtomicButton>
        <AtomicButton
          variant="primary"
          class="w-full justify-center"
          :loading="isSubmitting"
          :disabled="isSubmitting || !canPublish"
          @click="emit('publish')"
        >
          Publikasikan Proyek
        </AtomicButton>
      </div>
    </div>
  </div>
</template>
