<script setup lang="ts">
import type { ApplicationDetailResponse } from '../../types/application'
import { getSafePortfolioLinks } from '../../utils/application-presentation'

const props = withDefaults(defineProps<{
  application: ApplicationDetailResponse | null
  modelValue: boolean
  submitting?: boolean
}>(), { submitting: false })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  reviewed: [status: 'accepted' | 'rejected', note: string]
}>()

const reviewerNote = ref('')
const decision = ref<'accepted' | 'rejected' | null>(null)
const applicantName = computed(() =>
  props.application?.applicant_profile?.full_name || props.application?.applicant_profile?.username || 'Talent Kolaboria'
)
const roleName = computed(() =>
  props.application?.project_role?.contribution_role?.name || 'Kontributor'
)
const projectTitle = computed(() => props.application?.project?.title || 'proyek ini')
const safePortfolioLinks = computed(() => getSafePortfolioLinks(props.application?.portfolio_links))
const statusConfig: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Menunggu', classes: 'bg-accent-50 text-accent-800 ring-accent-200' },
  accepted: { label: 'Diterima', classes: 'bg-success-50 text-success-700 ring-success-200' },
  rejected: { label: 'Ditolak', classes: 'bg-danger-50 text-danger-700 ring-danger-200' },
  withdrawn: { label: 'Dibatalkan', classes: 'bg-neutral-100 text-neutral-600 ring-neutral-200' }
}
const availabilityLabels: Record<string, string> = {
  flexible: 'Fleksibel',
  full_time: 'Penuh waktu',
  part_time: 'Paruh waktu',
  weekends_only: 'Hanya akhir pekan'
}

watch(() => props.modelValue, (open) => {
  if (!open) {
    reviewerNote.value = ''
    decision.value = null
  }
})

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}
const openDecision = (status: 'accepted' | 'rejected') => {
  reviewerNote.value = ''
  decision.value = status
}
const submitDecision = () => {
  if (!decision.value || !props.application || props.submitting) return
  const status = decision.value
  emit('reviewed', status, reviewerNote.value.trim())
}
const formatDate = (value: string) => new Date(value).toLocaleDateString('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric'
})
</script>

<template>
  <OrganismModal
    :model-value="modelValue"
    :title="decision === 'accepted' ? 'Terima Kontributor?' : decision === 'rejected' ? 'Tolak Pengajuan?' : application ? 'Detail Pengajuan' : ''"
    :subtitle="decision ? 'Konfirmasi keputusan' : application ? `Diajukan ${formatDate(application.applied_at)}` : ''"
    size="md"
    :mobile-fullscreen="true"
    @update:model-value="emit('update:modelValue', $event)"
    @close="close"
  >
    <div v-if="application && decision" class="space-y-4">
      <p class="font-paragraph-3 text-secondary">
        {{ decision === 'accepted' ? 'Kontributor akan bergabung sebagai anggota proyek dan mengisi satu slot posisi.' : 'Pengajuan pelamar akan ditolak. Kamu dapat menambahkan alasan atau masukan yang sopan.' }}
      </p>
      <div class="rounded-lg border border-neutral-200 p-3">
        <p class="font-label-2 text-primary">{{ applicantName }}</p>
        <p class="mt-0.5 font-body-3 text-secondary">{{ roleName }} · {{ projectTitle }}</p>
      </div>
      <MoleculeTextarea
        v-model="reviewerNote"
        :label="decision === 'accepted' ? 'Catatan untuk pelamar (opsional)' : 'Catatan untuk pelamar (disarankan)'"
        :placeholder="decision === 'accepted' ? 'Tulis pesan untuk pelamar...' : 'Tulis pesan yang jelas dan sopan...'"
        :rows="4"
        :disabled="submitting"
      />
      <p v-if="decision === 'accepted'" class="rounded-lg bg-accent-50 px-3 py-2.5 font-body-3 text-accent-900">Pastikan ketersediaan slot dan ekspektasi kontribusi sudah sesuai.</p>
    </div>

    <div v-else-if="application" class="space-y-4">
      <div class="flex items-center gap-3 border-b border-neutral-200 pb-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-50 font-label-2 text-primary-700">
          <img v-if="application.applicant_profile?.avatar" :src="application.applicant_profile.avatar" :alt="`Foto ${applicantName}`" class="h-full w-full object-cover">
          <span v-else>{{ applicantName.slice(0, 2).toLocaleUpperCase('id-ID') }}</span>
        </div>
        <div class="min-w-0">
          <h2 class="truncate font-title-3 text-primary">{{ applicantName }}</h2>
          <p class="mt-0.5 truncate font-body-3 text-secondary">{{ application.applicant_profile?.headline || 'Talent Kolaboria' }}</p>
          <span :class="['mt-1.5 inline-flex rounded-full px-2 py-0.5 font-label-3 ring-1 ring-inset', statusConfig[application.status]?.classes]">{{ statusConfig[application.status]?.label || application.status }}</span>
        </div>
      </div>

      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-neutral-200 pb-4">
        <div><dt class="font-body-3 text-neutral-500">Posisi yang diajukan</dt><dd class="mt-0.5 font-label-2 text-primary">{{ roleName }}</dd></div>
        <div><dt class="font-body-3 text-neutral-500">Ketersediaan</dt><dd class="mt-0.5 font-label-2 text-primary">{{ availabilityLabels[application.availability] || application.availability }}</dd></div>
        <div><dt class="font-body-3 text-neutral-500">Slot posisi</dt><dd class="mt-0.5 font-label-2 text-primary">{{ application.project_role?.filled_capacity ?? 0 }} dari {{ application.project_role?.capacity ?? 0 }} terisi</dd></div>
        <div><dt class="font-body-3 text-neutral-500">Tanggal pengajuan</dt><dd class="mt-0.5 font-label-2 text-primary">{{ formatDate(application.applied_at) }}</dd></div>
      </dl>

      <section class="border-b border-neutral-200 pb-4">
        <h3 class="font-label-2 text-primary">Motivasi Bergabung</h3>
        <p class="mt-1.5 whitespace-pre-line font-paragraph-3 text-secondary">{{ application.motivation || 'Tidak ada motivasi yang dicantumkan.' }}</p>
      </section>
      <section v-if="application.expected_contribution" class="border-b border-neutral-200 pb-4">
        <h3 class="font-label-2 text-primary">Kontribusi yang Ditawarkan</h3>
        <p class="mt-1.5 whitespace-pre-line font-paragraph-3 text-secondary">{{ application.expected_contribution }}</p>
      </section>
      <section class="border-b border-neutral-200 pb-4">
        <h3 class="font-label-2 text-primary">Keahlian &amp; tools posisi</h3>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <span v-for="skill in application.project_role?.skills || []" :key="skill.id" class="rounded-md bg-neutral-100 px-2 py-1 font-body-3 text-neutral-600">{{ skill.name }}</span>
          <span v-for="tool in application.project_role?.tools || []" :key="tool.id" class="rounded-md bg-neutral-100 px-2 py-1 font-body-3 text-neutral-600">{{ tool.name }}</span>
          <span v-if="!application.project_role?.skills?.length && !application.project_role?.tools?.length" class="font-body-3 text-neutral-500">Belum ada keahlian atau tools posisi.</span>
        </div>
      </section>
      <section>
        <h3 class="font-label-2 text-primary">Portofolio</h3>
        <div v-if="safePortfolioLinks.length" class="mt-2 space-y-2">
          <a v-for="link in safePortfolioLinks" :key="link" :href="link" target="_blank" rel="noopener noreferrer" class="block truncate rounded-lg border border-neutral-200 px-3 py-2.5 font-body-3 text-primary-700 hover:border-primary-300 hover:text-primary-800">{{ link }} <Icon name="lucide:external-link" class="inline h-3.5 w-3.5" aria-hidden="true" /></a>
        </div>
        <p v-else class="mt-1.5 font-paragraph-3 text-secondary">Belum ada tautan portofolio.</p>
      </section>
      <p v-if="application.reviewer_note" class="rounded-lg bg-neutral-50 p-3 font-paragraph-3 text-secondary">Catatan sebelumnya: {{ application.reviewer_note }}</p>
    </div>

    <template #footer>
      <div v-if="decision" class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <AtomicButton variant="outline" class="w-full sm:w-auto" :disabled="submitting" @click="decision = null">Kembali</AtomicButton>
        <AtomicButton :variant="decision === 'accepted' ? 'primary' : 'outline-danger'" class="w-full sm:w-auto" :class="decision === 'accepted' ? 'bg-primary-600! hover:bg-primary-700!' : ''" :loading="submitting" @click="submitDecision">{{ decision === 'accepted' ? 'Ya, Terima' : 'Ya, Tolak' }}</AtomicButton>
      </div>
      <div v-else-if="application?.status === 'pending' && (application.permissions.can_reject || application.permissions.can_accept)" class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <AtomicButton v-if="application.permissions.can_reject" variant="outline-danger" class="w-full sm:w-auto" :disabled="submitting" @click="openDecision('rejected')">Tolak Pengajuan</AtomicButton>
        <AtomicButton v-if="application.permissions.can_accept" variant="primary" class="w-full sm:w-auto bg-primary-600! hover:bg-primary-700!" :disabled="submitting" @click="openDecision('accepted')">Terima Kontributor</AtomicButton>
      </div>
      <div v-else class="flex w-full justify-end">
        <AtomicButton variant="outline" class="w-full sm:w-auto" @click="close">Tutup</AtomicButton>
      </div>
    </template>
  </OrganismModal>
</template>
