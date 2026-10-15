<script setup lang="ts">
import { computed } from 'vue'
import { getProjectCategoryLabel } from '~/constants/projectCategory'
import type {
  ProjectEditorDraft,
  ProjectEditorErrors,
  ProjectEditorReferences
} from '~/types/project-editor'

const props = defineProps<{
  mode: 'create' | 'edit'
  references: ProjectEditorReferences
  errors: ProjectEditorErrors
  disabled: boolean
  organizationName?: string
}>()
const draft = defineModel<ProjectEditorDraft>('form', { required: true })
const totalSlots = computed(() =>
  draft.value.roles.reduce((sum, role) => sum + role.capacity, 0)
)
const roleName = (id?: string) =>
  props.references.contribution_roles.find((role) => role.id === id)?.name ||
  'Peran belum dipilih'
const toolNames = (ids: string[]) =>
  ids
    .map((id) => props.references.tools.find((tool) => tool.id === id)?.name)
    .filter(Boolean)
    .join(', ') || 'Belum dipilih'
const skillNames = (ids: string[]) =>
  ids
    .map(
      (id) =>
        props.references.skills.find((skill) => skill.id === id)?.name ?? id
    )
    .join(', ') || 'Belum dipilih'
const formatDate = (value: string | null) => {
  if (!value) return 'Belum ditentukan'
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  return `${match[3]}-${match[2]}-${match[1]}`
}
</script>

<template>
  <section aria-labelledby="project-review-title" class="space-y-6 p-4 lg:p-5">
    <header>
      <span class="font-label-2 text-brand">Langkah 5 dari 5</span>
      <h2 id="project-review-title" class="mt-2 font-title-1 text-primary">
        Review Proyek
      </h2>
      <p class="mt-2 font-paragraph-3">
        Periksa kembali informasi dan komitmen sebelum
        {{
          mode === 'create'
            ? 'menyimpan atau mencoba publikasi'
            : 'menyimpan perubahan'
        }}.
      </p>
    </header>

    <section
      class="rounded-xl border border-neutral-200 p-4"
      aria-label="Ownership proyek"
    >
      <template v-if="draft.creation_mode === 'organization_initiated'">
        <p class="font-label-1 text-primary">
          Diinisiasi oleh {{ organizationName || 'organisasi yang dipilih' }}
        </p>
        <p class="mt-2 font-body-2 text-primary">Belum memiliki Project Lead</p>
        <p class="mt-1 font-body-2">
          Setelah publikasi, proyek berstatus Mencari Project Lead. Kamu tidak
          menjadi owner. Kontributor belum dapat melamar sebelum ada owner.
        </p>
        <p class="mt-2 font-body-2">
          Flow claim akan tersedia pada tahap berikutnya.
        </p>
      </template>
      <template v-else>
        <p class="font-label-1 text-primary">Kamu menjadi Project Lead</p>
        <p class="mt-1 font-body-2">
          Proyek ini atas nama pribadi. Kamu menjadi owner dan memimpin proses
          kolaborasi.
        </p>
      </template>
    </section>

    <div
      v-if="Object.keys(errors).length"
      class="rounded-xl border border-danger-200 bg-danger-50 p-4"
      role="alert"
    >
      <p class="font-label-1 text-danger-800">
        Ada bagian yang perlu diperbaiki.
      </p>
      <p class="mt-1 font-body-2 text-danger-700">
        Pilih tahap yang ditandai pada navigasi untuk melengkapi informasi.
      </p>
    </div>

    <article class="rounded-xl border border-neutral-200 bg-white p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span class="font-label-2"
            >{{ getProjectCategoryLabel(draft.project_category) }} ·
            {{ draft.visibility === 'public' ? 'Publik' : 'Undangan' }}</span
          >
          <h3 class="mt-1 font-title-2 text-primary">
            {{ draft.title || 'Judul proyek' }}
          </h3>
          <p class="mt-2 font-paragraph-3">
            {{ draft.summary || 'Ringkasan proyek akan tampil di sini.' }}
          </p>
        </div>
        <span
          class="rounded-full bg-primary-50 px-3 py-1 font-label-2 text-primary-700"
          >{{ totalSlots }} posisi</span
        >
      </div>
      <div class="mt-5 border-t border-neutral-100 pt-4">
        <h4 class="font-label-1 text-primary">Deskripsi proyek</h4>
        <p class="mt-2 whitespace-pre-line font-body-2">
          {{ draft.description || 'Belum ada deskripsi.' }}
        </p>
      </div>
    </article>

    <section class="space-y-3" aria-labelledby="review-team-title">
      <div class="space-y-2">
        <h3 id="review-team-title" class="font-title-3 text-primary">
          Kebutuhan tim
        </h3>
        <dl
          v-if="
            draft.creation_mode === 'personal' &&
            draft.owner_contribution_role_id
          "
          class="grid grid-cols-1 gap-0.5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-baseline sm:gap-x-2"
        >
          <dt class="font-label-2">Peran Project Lead:</dt>
          <dd class="break-words font-body-2 leading-relaxed text-primary">
            {{
              roleName(draft.owner_contribution_role_id)
            }}
          </dd>
        </dl>
      </div>
      <article
        v-for="(role, index) in draft.roles"
        :key="role.client_key"
        class="rounded-xl border border-neutral-200 p-4"
      >
        <div class="flex flex-wrap justify-between gap-2">
          <h4 class="font-label-1 text-primary">
            {{ roleName(role.contribution_role_id) }}
          </h4>
          <span class="font-label-2"
            >{{ role.capacity }} posisi<span v-if="role.filled_capacity">
              · {{ role.filled_capacity }} terisi</span
            ></span
          >
        </div>
        <p class="mt-2 whitespace-pre-line font-body-2 leading-relaxed">
          {{ role.description || 'Tanggung jawab belum diisi.' }}
        </p>
        <div class="mt-3 space-y-3">
          <div>
            <p class="font-label-2">Keahlian:</p>
            <p class="mt-1 font-body-2 leading-relaxed text-primary">
        {{ skillNames(role.skill_ids) }}
            </p>
          </div>
          <div>
            <p class="font-label-2">Tools:</p>
            <p class="mt-1 font-body-2 leading-relaxed text-primary">
              {{ toolNames(role.tool_ids) }}
            </p>
          </div>
        </div>
        <span class="sr-only">Peran {{ index + 1 }}</span>
      </article>
    </section>

    <section
      class="grid gap-4 sm:grid-cols-2"
      aria-label="Konteks dan jadwal proyek"
    >
      <article class="rounded-xl border border-neutral-200 p-4">
        <h3 class="font-label-1 text-primary">Konteks kolaborasi</h3>
        <div class="mt-3 space-y-3">
          <div>
            <p class="font-label-2">Alasan kolaborasi:</p>
            <p class="mt-1 font-body-2 leading-relaxed text-primary">
              {{ draft.why_collaborative || 'Belum diisi.' }}
            </p>
          </div>
          <div>
            <p class="font-label-2">Kontributor diharapkan mendapat:</p>
            <p class="mt-1 font-body-2 leading-relaxed text-primary">
              {{ draft.contributor_outcome || 'Belum diisi.' }}
            </p>
          </div>
          <div>
            <p class="font-label-2">
              {{
                draft.creation_mode === 'organization_initiated'
                  ? 'Ekspektasi untuk Project Lead:'
                  : 'Komitmenmu sebagai Project Lead:'
              }}
            </p>
            <p class="mt-1 font-body-2 leading-relaxed text-primary">
              {{
                (draft.creation_mode === 'organization_initiated'
                  ? draft.lead_expectations
                  : draft.owner_commitment) || 'Belum diisi.'
              }}
            </p>
          </div>
        </div>
      </article>
      <article class="rounded-xl border border-neutral-200 p-4">
        <h3 class="font-label-1 text-primary">Waktu & komitmen</h3>
        <div class="mt-3 space-y-3">
          <div>
            <p class="font-label-2">Mulai:</p>
            <p class="mt-1 font-body-2 leading-relaxed text-primary">
              {{ formatDate(draft.start_date) }}
            </p>
          </div>
          <div>
            <p class="font-label-2">Target:</p>
            <p class="mt-1 font-body-2 leading-relaxed text-primary">
              {{ formatDate(draft.deadline) }}
            </p>
          </div>
          <div>
            <p class="font-label-2">Ketersediaan:</p>
            <p class="mt-1 font-body-2 leading-relaxed text-primary">
              {{ draft.availability.replaceAll('_', ' ') }} ·
              {{ draft.hours_per_week }} jam/minggu
            </p>
          </div>
        </div>
        <p class="mt-3 font-body-2">
          {{
            draft.collaboration_agreement
              ? 'Prinsip kolaborasi disetujui.'
              : 'Persetujuan prinsip kolaborasi belum diberikan.'
          }}
        </p>
      </article>
    </section>
  </section>
</template>
