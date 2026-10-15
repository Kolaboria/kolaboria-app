<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  createEmptyProjectEditorReferences
} from '~/data/project-editor-defaults'
import { useProjectEditor } from '~/composables/useProjectEditor'
import { useProjectEditorCatalogs } from '~/composables/useProjectEditorCatalogs'
import { useProjectEditorNotifications } from '~/composables/useProjectEditorNotifications'
import { useAuth } from '~/composables/useAuth'
import { useProjectLifecycle } from '~/composables/useProjectLifecycle'
import ProjectLifecycleActions from '../ProjectLifecycleActions.vue'
import ProjectStatusConfirmModal from '../ProjectStatusConfirmModal.vue'
import { validateProjectEditorStep } from '~/data/project-editor-validation'
import type {
  ProjectCreationMode,
  ProjectEditorMode,
  ProjectDetailResponse,
  ProjectEditorCreationContext,
  ProjectEditorEligibility,
  ProjectEditorPersistence,
  ProjectEditorRecord,
  ProjectLifecycleAction
} from '~/types/project-editor'

const props = defineProps<{
  mode: ProjectEditorMode
  slug?: string
  accountId?: string
  creationContext?: ProjectEditorCreationContext
  eligibility?: ProjectEditorEligibility
  contextAvailable?: boolean
  initialRecord?: ProjectEditorRecord | null
  initialDetail?: ProjectDetailResponse | null
  persistence: ProjectEditorPersistence
}>()
const emit = defineEmits<{
  (event: 'dirty-change', dirty: boolean): void
  (event: 'submitting-change', submitting: boolean): void
}>()
const router = useRouter()
const { currentUserId } = useAuth()
const references = reactive(
  createEmptyProjectEditorReferences()
)
const creationContext = computed<ProjectEditorCreationContext>(
  () =>
    props.creationContext ?? {
      system_role: 'user',
      initiable_organizations: []
    }
)
const stepLabels = [
  'Informasi Dasar',
  'Kebutuhan Tim',
  'Konteks Kolaborasi',
  'Waktu & Komitmen',
  'Review'
]
const { catalogStates, ensureCatalog, hydrateSelected } =
  useProjectEditorCatalogs({
    references,
    scopeKey: () =>
      `${props.accountId || currentUserId.value || 'unknown-account'}:${props.mode}:${props.slug || ''}`
  })
if (props.initialDetail) hydrateSelected(props.initialDetail)
const editor = useProjectEditor({
  mode: props.mode,
  slug: props.slug,
  currentUserId: props.accountId || currentUserId.value || '',
  references,
  initialRecord: props.initialRecord,
  persistence: props.persistence,
  get eligibility() {
    return (
      props.eligibility ?? {
        email_verified: false,
        onboarding_completed: false
      }
    )
  },
  get creationContext() {
    return creationContext.value
  },
  contextAvailable: () => props.contextAvailable ?? false
})
useProjectEditorNotifications(editor)
watch(editor.isDirty, (value) => emit('dirty-change', value), {
  immediate: true
})
watch(editor.isSubmitting, (value) => emit('submitting-change', value), {
  immediate: true
})
const isOrganization = computed(
  () => editor.draft.value.creation_mode === 'organization_initiated'
)
const isSavedDraft = computed(
  () => props.mode === 'edit' && editor.record.value?.status === 'draft'
)
const lifecycleMenu = ref<HTMLDetailsElement | null>(null)
const toast = useToast()
const lifecycle = useProjectLifecycle({
  accountId: computed(() => props.accountId || currentUserId.value),
  onChanged: async (action, detail) => {
    toast.success(action === 'delete' ? 'Draft proyek berhasil dihapus.' : action === 'draft' ? 'Proyek berhasil dikembalikan ke draft.' : 'Proyek berhasil diarsipkan.')
    if (action === 'draft' && detail) editor.acceptServerDetail(detail)
    else await router.replace('/projects/my-projects')
  }
})
const canManageLifecycle = computed(() => {
  const ownership = editor.record.value?.ownership
  return Boolean(ownership && (ownership.owner_id === (props.accountId || currentUserId.value) ||
    (!ownership.owner_id && editor.selectedOrganization.value)))
})
const requestLifecycle = (action: ProjectLifecycleAction) => {
  const record = editor.record.value
  if (!record || !canManageLifecycle.value || editor.isDirty.value || editor.isSubmitting.value || props.contextAvailable === false) return
  lifecycleMenu.value?.removeAttribute('open')
  lifecycle.request(action, { id: record.id, title: editor.draft.value.title, status: record.status, version: record.version })
}
const completedSteps = computed(() =>
  [0, 1, 2, 3, 4].map(
    (step) =>
      Object.keys(
        validateProjectEditorStep(
          step as 0 | 1 | 2 | 3 | 4,
          editor.draft.value,
          references
        )
      ).length === 0
  )
)
const canContinue = computed(() => !editor.isSubmitting.value)
const { show: showPopup } = usePopup()
const { triggerCancel } = useFormGuard(() => editor.isDirty.value)
const changeCreationMode = (mode: ProjectCreationMode) => {
  if (mode === editor.draft.value.creation_mode || editor.isSubmitting.value)
    return
  const apply = () => {
    editor.setCreationMode(mode)
  }
  if (!editor.isDirty.value) return apply()
  showPopup({
    title: 'Ganti atas nama siapa proyek dibuat?',
    description:
      'Setiap pilihan memiliki draft terpisah. Perubahan yang belum tersimpan bisa dipulihkan dari browser selama penyimpanan lokal tersedia.',
    type: 'warning',
    positiveLabel: 'Ganti pilihan',
    negativeLabel: 'Kembali',
    onPositive: apply
  })
}

const changeOrganization = (id: string) => {
  if (
    id === editor.draft.value.initiator_organization_id ||
    editor.isSubmitting.value
  )
    return
  if (
    !creationContext.value.initiable_organizations.some(
      (organization) => organization.id === id
    )
  )
    return
  const apply = () => {
    editor.selectOrganization(id)
  }
  if (!editor.isDirty.value) return apply()
  showPopup({
    title: 'Ganti organisasi?',
    description:
      'Setiap organisasi memiliki draft terpisah. Perubahan yang belum tersimpan bisa dipulihkan dari browser selama penyimpanan lokal tersedia.',
    type: 'warning',
    positiveLabel: 'Ganti organisasi',
    negativeLabel: 'Kembali',
    onPositive: apply
  })
}

const cancel = () =>
  triggerCancel(
    props.mode === 'edit' ? `/projects/${props.slug}` : '/projects/my-projects'
  )
const next = () => editor.next()
const saveDraft = async () => {
  if (!(await editor.saveDraft())) return
  await router.replace('/projects/my-projects')
}
const saveChanges = async () => {
  if (!(await editor.saveChanges())) return
  await router.replace('/projects/my-projects')
}
const publish = () => {
  showPopup({
    title: isOrganization.value
      ? 'Publikasikan proyek organisasi?'
      : 'Publikasikan proyek?',
    description: props.mode === 'create' && !editor.record.value?.id
      ? isOrganization.value
        ? 'Proyek akan langsung dipublikasikan untuk mencari Project Lead.'
        : 'Proyek akan langsung dipublikasikan dan dapat dilihat oleh kontributor.'
      : isOrganization.value && !editor.record.value?.ownership?.owner_id
        ? 'Proyek akan dipublikasikan untuk mencari Project Lead. Perubahan pada draft akan disimpan bersama publikasi.'
        : 'Proyek akan dipublikasikan secara publik. Perubahan pada draft akan disimpan bersama publikasi.',
    type: 'info',
    positiveLabel: 'Ya, publikasikan',
    negativeLabel: 'Kembali',
    onPositive: async () => {
      const isCompletingCreation =
        props.mode === 'create' || editor.record.value?.status === 'draft'
      if (!(await editor.publish())) return
      const slug = editor.record.value?.slug
      if (slug) {
        await router.push(
          isCompletingCreation ? '/projects/my-projects' : `/projects/${slug}`
        )
      }
    }
  })
}
</script>

<template>
  <main
    class="project-editor-shell mx-auto flex w-full flex-col lg:px-4 pt-8 pb-0 sm:px-6 lg:px-8"
    :class="
      props.mode === 'create'
        ? 'min-h-[calc(100dvh-4rem)] lg:min-h-[calc(100dvh-6rem)]'
        : 'min-h-[calc(100dvh-6rem)]'
    "
  >
      <ProjectEditorMobileHeader
        class="sticky top-16 z-40 -mt-8 bg-white sm:static sm:z-auto sm:hidden"
        :current-step="editor.currentStep.value"
        :step-label="stepLabels[editor.currentStep.value] ?? 'Informasi Dasar'"
      />
      <header class="mb-8 hidden sm:block">
        <h1 class="font-title-1 text-primary">
          {{ props.mode === 'edit' ? 'Edit Proyek' : 'Buat Proyek' }}
        </h1>
        <p class="mt-2 max-w-3xl font-paragraph-2 text-secondary">
          {{
            props.mode === 'edit'
              ? `Perbarui detail ${editor.draft.value.title} dan tinjau kembali kebutuhan tim.`
              : 'Bagikan proyek nyata dan jelaskan kebutuhan setiap peran secara spesifik agar talenta memahami posisi, tanggung jawab, dan kontribusi yang diharapkan.'
          }}
        </p>
      </header>
      <div v-if="props.mode === 'edit' && canManageLifecycle && editor.record.value && ['draft', 'open'].includes(editor.record.value.status)" class="mb-5 flex flex-wrap items-center justify-end gap-3">
        <p v-if="editor.isDirty.value" class="font-body-3 text-secondary">Simpan perubahan sebelum mengelola status atau menghapus draft.</p>
        <details ref="lifecycleMenu" class="relative">
          <summary class="cursor-pointer rounded-lg border border-neutral-300 bg-white px-4 py-2 font-label-2 text-secondary">Kelola proyek</summary>
          <div class="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-neutral-200 bg-white py-1.5 shadow-lg">
            <ProjectLifecycleActions
              :status="editor.record.value.status"
              :can-manage="canManageLifecycle"
              :disabled="editor.isDirty.value || editor.isSubmitting.value || lifecycle.pending.value || contextAvailable === false"
              @select="requestLifecycle"
            />
          </div>
        </details>
      </div>
      <div
        v-if="isOrganization && !editor.selectedOrganization.value"
        class="mb-5 rounded-xl border border-accent-200 bg-accent-50 p-4"
        role="alert"
      >
        <p class="font-body-3 text-accent-800">
          Akses ke organisasi ini sudah tidak tersedia. Isian draftmu tetap ada,
          tetapi proyek organisasi ini belum bisa disimpan atau dipublikasikan.
        </p>
        <AtomicButton
          class="mt-3"
          variant="outline"
          :disabled="editor.isSubmitting.value || contextAvailable === false"
          @click="changeCreationMode('personal')"
          >Buat atas nama pribadi</AtomicButton
        >
      </div>

      <div
        v-if="editor.storageWarning.value"
        class="mb-5 rounded-xl border border-accent-200 bg-accent-50 p-4 font-body-3 text-accent-800"
        role="status"
      >
        {{ editor.storageWarning.value }}
      </div>

      <div class="project-editor-grid min-h-0 flex-1 gap-5">
        <ProjectEditorNavigation
          class="self-start"
          :mode="props.mode"
          :current-step="editor.currentStep.value"
          :completed-steps="completedSteps"
          @navigate="editor.goToStep"
        />
        <div class="flex min-h-0 min-w-0 flex-col gap-0 sm:gap-5">
          <section
            class="flex min-w-0 flex-col self-stretch rounded-lg border-0 bg-white p-0 sm:rounded-xl sm:border sm:border-neutral-200 sm:bg-white"
          >
            <ProjectEditorInfo
              v-if="editor.currentStep.value === 0"
              v-model:form="editor.draft.value"
              :mode="props.mode"
              :creation-context="creationContext"
              :errors="editor.errors.value"
              :disabled="editor.isSubmitting.value"
              @change-creation-mode="changeCreationMode"
              @change-organization="changeOrganization"
            />
            <ProjectEditorTeam
              v-else-if="editor.currentStep.value === 1"
              v-model:form="editor.draft.value"
              :references="references"
              :catalog-states="catalogStates"
              :errors="editor.errors.value"
              :disabled="editor.isSubmitting.value"
              @add-role="editor.addRole"
              @remove-role="editor.removeRole"
              @load-catalog="ensureCatalog"
            />
            <ProjectEditorContext
              v-else-if="editor.currentStep.value === 2"
              v-model:form="editor.draft.value"
              :errors="editor.errors.value"
              :disabled="editor.isSubmitting.value"
              @set-origin="editor.setOrigin"
            />
            <ProjectEditorTimeline
              v-else-if="editor.currentStep.value === 3"
              v-model:form="editor.draft.value"
              :errors="editor.errors.value"
              :disabled="editor.isSubmitting.value"
            />
            <ProjectEditorReview
              v-else
              v-model:form="editor.draft.value"
              :mode="props.mode"
              :organization-name="editor.selectedOrganization.value?.name"
              :references="references"
              :errors="editor.errors.value"
              :disabled="editor.isSubmitting.value"
            />

            <p
              v-if="props.mode === 'create' && !editor.canPublish.value"
              class="mb-3 text-right font-body-3 text-secondary"
            >
              {{
                'Verifikasi email dan selesaikan onboarding sebelum memublikasikan proyek.'
              }}
            </p>
          </section>
          <ProjectEditorActions
            :mode="props.mode"
            :current-step="editor.currentStep.value"
            :is-submitting="editor.isSubmitting.value || lifecycle.pending.value"
            :can-publish="
              editor.canPublish.value &&
              (props.mode === 'create' || isSavedDraft)
            "
            :can-save="
              contextAvailable !== false &&
              (!isOrganization || Boolean(editor.selectedOrganization.value))
            "
            :is-draft="isSavedDraft"
            @back="editor.back"
            @next="next"
            @cancel="cancel"
            @save-draft="saveDraft"
            @save-changes="saveChanges"
            @publish="publish"
          />
          <p v-if="!canContinue" class="sr-only" role="status">
            {{
              'Sedang menyimpan proyek ke server.'
            }}
          </p>
        </div>
      </div>
      <ProjectStatusConfirmModal
        :show="Boolean(lifecycle.target.value)"
        :action="lifecycle.action.value"
        :project-title="lifecycle.target.value?.title || ''"
        :pending="lifecycle.pending.value"
        :error-message="lifecycle.errorMessage.value"
        :disable-confirm="lifecycle.conflict.value"
        @close="lifecycle.close"
        @confirm="lifecycle.confirm"
      />
  </main>
</template>

<style scoped>
.project-editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

@media (min-width: 64rem) {
  .project-editor-grid {
    grid-template-columns: 16rem minmax(0, 1fr);
  }
}
</style>
