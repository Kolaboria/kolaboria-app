<template>
  <div
    class="min-h-screen bg-[#f8fafc] text-neutral-900 pb-24 lg:pb-16"
    ref="pageRoot"
  >
    <!-- Loading State -->
    <OrganismAsyncContent
      :pending="pending"
      :ready="Boolean(project)"
      label="Memuat detail proyek..."
    >
      <!-- Error / Not Found -->
      <div
        v-if="error || !project"
        class="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center"
      >
        <div class="text-5xl mb-4">🔍</div>
        <h1 class="text-2xl font-bold text-neutral-900 mb-2">
          Proyek Tidak Ditemukan
        </h1>
        <p class="text-neutral-600 mb-6 max-w-md">
          Proyek yang kamu cari tidak ada atau terjadi kesalahan saat memuat
          data.
        </p>
        <AtomicButton variant="primary" to="/projects">
          Kembali ke Proyek
        </AtomicButton>
      </div>

      <!-- Project Detail -->
      <div v-else>
        <!-- Draft Banner -->
        <div
          v-if="project.status === 'draft' && canEditDefinition"
          class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4"
        >
          <MoleculeTicker
            variant="warning"
            message="Proyek ini masih berupa draf. Publikasikan proyek untuk membuatnya dapat dilihat oleh publik."
            :closable="false"
            @action-click="navigateTo(`/projects/${project.slug}/edit`)"
            action-label="Edit & Publikasikan"
          />
        </div>

        <!-- Main Container -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <!-- Breadcrumb Navigation -->
          <nav
            aria-label="Breadcrumb"
            class="mb-6 flex items-center text-xs text-neutral-500"
          >
            <NuxtLink
              to="/projects"
              class="hover:text-neutral-800 transition-colors"
            >
              Proyek
            </NuxtLink>
            <span class="mx-2 text-neutral-400">/</span>
            <span
              class="text-neutral-700 font-medium truncate max-w-xs sm:max-w-md"
            >
              {{ project.title }}
            </span>
          </nav>

          <!-- Two-column Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <!-- LEFT COLUMN: Main Project Details -->
            <div class="lg:col-span-8 flex flex-col gap-6" ref="heroSection">
              <!-- Card 1: Header / Overview Card -->
              <article
                class="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs"
              >
                <!-- Top Tags -->
                <div class="flex flex-wrap items-center gap-2.5">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                    :class="statusBadgeClass"
                  >
                    {{ statusBadgeText }}
                  </span>
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {{ projectCreationModeLabel }}
                  </span>
                </div>

                <!-- Main Title -->
                <h1
                  class="font-title-1 font-bold text-neutral-900 text-2xl sm:text-3xl tracking-tight leading-snug"
                >
                  {{ project.title }}
                </h1>

                <!-- Summary -->
                <p class="text-neutral-600 font-paragraph-2 leading-relaxed">
                  {{ project.summary }}
                </p>

                <!-- Creator Info -->
                <div class="flex items-center gap-3 pt-2">
                  <img
                    v-if="creatorAvatar"
                    :src="creatorAvatar"
                    :alt="creatorName"
                    class="w-10 h-10 rounded-full object-cover border border-neutral-200"
                  />
                  <div
                    v-else
                    class="w-10 h-10 rounded-full bg-[#e0e7ff] text-[#4338ca] font-bold flex items-center justify-center text-sm shrink-0 uppercase"
                  >
                    {{ creatorInitial }}
                  </div>
                  <div>
                    <NuxtLink
                      v-if="creatorUsername"
                      :to="`/profile/${creatorUsername}`"
                      class="font-label-1 font-bold text-neutral-900 hover:text-primary-600 transition-colors block leading-tight"
                    >
                      {{ creatorName }}
                    </NuxtLink>
                    <span
                      v-else
                      class="font-label-1 font-bold text-neutral-900 block leading-tight"
                    >
                      {{ creatorName }}
                    </span>
                    <p class="text-xs text-neutral-500 mt-0.5">
                      {{ creatorAttribution
                      }}<span v-if="creatorUsername">
                        · Profil
                        {{
                          isCreatorVerified
                            ? 'terverifikasi'
                            : 'belum terverifikasi'
                        }}</span
                      >
                    </p>
                    <p
                      v-if="project.initiator_organization"
                      class="text-xs text-neutral-500 mt-1"
                    >
                      Diinisiasi oleh {{ project.initiator_organization.name }}
                      <NuxtLink
                        v-if="project.initiator_profile?.username"
                        :to="`/profile/${project.initiator_profile.username}`"
                        class="font-medium text-primary-700 hover:underline"
                      >
                        ·
                        {{
                          project.initiator_profile.full_name ||
                          project.initiator_profile.username
                        }}
                      </NuxtLink>
                      <span v-else-if="project.initiator_profile?.full_name">
                        · {{ project.initiator_profile.full_name }}
                      </span>
                    </p>
                  </div>
                </div>
              </article>

              <!-- Card 2: Tentang Proyek -->
              <article
                class="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs"
              >
                <h2 class="font-title-3 font-bold text-neutral-900">
                  Tentang proyek
                </h2>
                <div
                  class="space-y-4 text-neutral-600 font-paragraph-2 leading-relaxed"
                >
                  <p
                    v-for="(paragraph, idx) in descriptionParagraphs"
                    :key="idx"
                  >
                    {{ paragraph }}
                  </p>
                  <p v-if="descriptionParagraphs.length === 0">
                    {{ project.summary }}
                  </p>
                </div>
              </article>

              <!-- Card 3: Kenapa Proyek Ini Dibuka Untuk Kolaborasi? -->
              <article
                class="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-5 shadow-xs"
              >
                <h2 class="font-title-3 font-bold text-neutral-900">
                  Kenapa proyek ini dibuka untuk kolaborasi?
                </h2>
                <p class="text-neutral-600 font-paragraph-2 leading-relaxed">
                  {{ collaborativeReason }}
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div
                    class="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4"
                  >
                    <p class="text-xs text-neutral-500 font-medium mb-1">
                      Konteks proyek
                    </p>
                    <p class="text-sm font-semibold text-neutral-900">
                      {{ projectOriginLabel }}
                    </p>
                  </div>
                  <div
                    class="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4"
                  >
                    <p class="text-xs text-neutral-500 font-medium mb-1">
                      Bentuk kolaborasi
                    </p>
                    <p class="text-sm font-semibold text-neutral-900">
                      {{ collaborationFormatLabel }}
                    </p>
                  </div>
                </div>
              </article>

              <!-- Card 4: Kontributor yang Dibutuhkan -->
              <article
                class="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs"
              >
                <div>
                  <h2 class="font-title-3 font-bold text-neutral-900">
                    Kontributor yang dibutuhkan
                  </h2>
                  <p class="text-sm text-neutral-500 mt-1">
                    Cari peran yang paling sesuai dengan kemampuan dan
                    pengalaman yang ingin kamu bangun.
                  </p>
                </div>

                <div v-if="visibleRoles.length > 0" class="space-y-4 mt-2">
                  <div
                    v-for="role in visibleRoles"
                    :key="role.id"
                    class="rounded-xl border border-neutral-200 bg-white p-5 space-y-3"
                  >
                    <div
                      class="flex items-center justify-between gap-3 flex-wrap"
                    >
                      <h3 class="font-label-1 font-bold text-neutral-900">
                        {{
                          role.custom_title ||
                          role.contribution_role?.name ||
                          'Peran kontributor'
                        }}
                      </h3>
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        :class="roleAvailabilityClass(role)"
                      >
                        {{ roleAvailabilityLabel(role) }}
                      </span>
                    </div>
                    <p
                      v-if="role.description"
                      class="text-sm text-neutral-600 leading-relaxed"
                    >
                      {{ role.description }}
                    </p>
                    <div
                      v-if="getRoleTags(role).length > 0"
                      class="flex flex-wrap items-center gap-2 pt-1"
                    >
                      <span
                        v-for="tag in getRoleTags(role)"
                        :key="tag"
                        class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-50 text-neutral-700 border border-neutral-200"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  v-else
                  class="rounded-xl border border-neutral-200 bg-neutral-50/50 p-6 text-center text-sm text-neutral-500"
                >
                  Belum ada peran kontributor yang didefinisikan secara
                  spesifik.
                </div>
              </article>

              <!-- Card 5: Hasil untuk Kontributor -->
              <article
                v-if="contributorOutcome"
                class="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs"
              >
                <h2 class="font-title-3 font-bold text-neutral-900">
                  Hasil untuk kontributor
                </h2>
                <p class="text-neutral-600 font-paragraph-2 leading-relaxed">
                  {{ contributorOutcome }}
                </p>
              </article>

              <!-- Card 6: Komitmen Pemilik Proyek -->
              <article
                class="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-3 shadow-xs"
              >
                <h2 class="font-title-3 font-bold text-neutral-900">
                  {{ ownerCommitmentHeading }}
                </h2>
                <p class="text-neutral-600 font-paragraph-2 leading-relaxed">
                  {{
                    ownerCommitmentText ||
                    'Belum ada informasi komitmen pemilik proyek.'
                  }}
                </p>
              </article>
            </div>

            <!-- RIGHT COLUMN / SIDEBAR: Summary & Actions -->
            <div class="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-20">
              <!-- Card 1: Ringkasan Proyek -->
              <article
                class="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 space-y-6 shadow-xs"
              >
                <h2 class="font-title-3 font-bold text-neutral-900">
                  Ringkasan proyek
                </h2>

                <div class="space-y-3.5 divide-y divide-neutral-100">
                  <div
                    class="flex items-center justify-between text-sm pt-1 first:pt-0"
                  >
                    <span class="text-neutral-500">Status</span>
                    <span class="font-semibold text-neutral-900">{{
                      statusLabel
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm pt-3">
                    <span class="text-neutral-500">Mulai</span>
                    <span class="font-semibold text-neutral-900">{{
                      formattedStartDate || 'Belum ditentukan'
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm pt-3">
                    <span class="text-neutral-500">Target selesai</span>
                    <span class="font-semibold text-neutral-900">{{
                      formattedDeadline || 'Belum ditentukan'
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm pt-3">
                    <span class="text-neutral-500">Ketersediaan</span>
                    <span class="font-semibold text-neutral-900">{{
                      availabilityLabel
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm pt-3">
                    <span class="text-neutral-500">Komitmen</span>
                    <span class="font-semibold text-neutral-900">{{
                      commitmentLabel
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm pt-3">
                    <span class="text-neutral-500">Tim</span>
                    <span class="font-semibold text-neutral-900">{{
                      teamCountLabel
                    }}</span>
                  </div>
                </div>

                <!-- CTA Actions -->
                <div class="space-y-2.5 pt-2">
                  <NuxtLink
                    v-if="canApply && !user"
                    to="/login"
                    class="inline-flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    Masuk untuk melamar
                  </NuxtLink>

                  <NuxtLink
                    v-else-if="canApply && !isVerified"
                    to="/verify-email-notice"
                    class="inline-flex w-full items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    Verifikasi email untuk melamar
                  </NuxtLink>

                  <template v-else-if="canApply">
                    <AtomicButton
                      variant="primary"
                      block
                      class="!py-3 !rounded-xl font-semibold !text-sm"
                      :disabled="!isVerified"
                      @click="isVerified ? (showApplyModal = true) : null"
                    >
                      Ajukan Kontribusi
                    </AtomicButton>
                  </template>

                  <template v-else-if="!isProjectOwner">
                    <MoleculeTicker
                      :variant="applicationUnavailableVariant"
                      :title="applicationUnavailableTitle"
                      :message="applicationUnavailableMessage"
                      :closable="false"
                    />
                  </template>

                  <AtomicButton
                    v-if="canEditDefinition"
                    :to="`/projects/${project.slug}/edit`"
                    variant="outline"
                    block
                    class="!py-3 !rounded-xl font-semibold !text-sm"
                  >
                    Edit Proyek
                  </AtomicButton>

                  <p
                    v-if="canApply"
                    class="text-xs text-neutral-500 text-center leading-relaxed"
                  >
                    Pastikan profil dan ketersediaanmu sudah sesuai sebelum
                    mengajukan kontribusi.
                  </p>
                  <MoleculeTicker
                    v-if="user && canApply && !isVerified"
                    variant="warning"
                    title="Verifikasi email diperlukan"
                    message="Verifikasi email Anda terlebih dahulu untuk mengajukan kontribusi."
                    :closable="false"
                  />
                </div>
              </article>

              <!-- Card 2: Transparansi Proyek -->
              <article
                class="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 space-y-4 shadow-xs"
              >
                <h2 class="font-title-3 font-bold text-neutral-900">
                  Transparansi proyek
                </h2>
                <ul class="space-y-3">
                  <li
                    v-for="item in transparencyItems"
                    :key="item"
                    class="flex items-center gap-2.5 text-sm text-neutral-700"
                  >
                    <svg
                      class="w-4 h-4 text-emerald-600 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </article>
            </div>
          </div>
        </div>

        <!-- Mobile Sticky Bottom CTA Bar -->
        <div
          class="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 lg:hidden"
          :class="
            showStickyBar
              ? 'translate-y-0 opacity-100'
              : 'translate-y-full opacity-0 pointer-events-none'
          "
        >
          <div
            class="max-w-7xl mx-auto flex items-center justify-between gap-4"
          >
            <div class="min-w-0 flex-1">
              <p class="font-label-2 text-neutral-900 truncate">
                {{ project.title }}
              </p>
              <p class="text-xs text-neutral-500 mt-0.5">
                <span
                  class="inline-block w-1.5 h-1.5 rounded-full mr-1"
                  :class="openSlots > 0 ? 'bg-emerald-500' : 'bg-neutral-400'"
                ></span>
                {{
                  project.status === 'open' && openSlots > 0
                    ? `${openSlots} slot tersedia`
                    : statusLabel
                }}
              </p>
            </div>
            <div class="shrink-0">
              <template v-if="canEditDefinition">
                <AtomicButton
                  :to="`/projects/${project.slug}/edit`"
                  variant="primary"
                  size="sm"
                  class="!rounded-xl font-semibold"
                >
                  Edit Proyek
                </AtomicButton>
              </template>
              <template v-else-if="canApply">
                <button
                  type="button"
                  class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#4f46e5] hover:bg-[#4338ca] transition-colors disabled:bg-neutral-300 cursor-pointer"
                  :disabled="!isVerified"
                  @click="isVerified ? (showApplyModal = true) : null"
                >
                  Ajukan Kontribusi
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </OrganismAsyncContent>
    <!-- Apply Modal -->
    <ProjectApplyModal
      v-if="project && canApply"
      :project-id="project.id"
      :roles="availableRoles"
      :show="showApplyModal"
      @close="showApplyModal = false"
      @applied="handleApplied"
    />
  </div>
</template>

<script setup lang="ts">
import type { Project, ProjectRole } from '~/types/project'
import { useProjectEditorApi } from '~/composables/useProjectEditorApi'
import {
  getProjectContributorOutcome,
  getProjectContributionAvailabilityMessage,
  getProjectApplicationStatusCopy,
  getProjectApplicationUnavailableTitle,
  getProjectOwnerAttribution,
  isProjectDefinitionEditableBy,
  toProjectDetailView
} from '~/utils/project-presentation'
import { getProjectCategoryLabel } from '~/constants/projectCategory'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: 'home',
  homeNavbar: {
    mainHorizontalPadding: 'none',
    mainWidth: 'wide'
  }
})

const route = useRoute()

const { user, isVerified } = useAuth()

const projectSlug = route.params.slug as string

const persistence = useProjectEditorApi()
const {
  data: project,
  error,
  pending,
  refresh: refreshProject
} = await useLazyAsyncData<Project | null>(`project-${projectSlug}`, async () =>
  toProjectDetailView(await persistence.loadBySlug(projectSlug))
)

useHead(() => ({
  title: project.value
    ? `${project.value.title} - Kolaboria`
    : 'Project - Kolaboria'
}))

const canAcceptContributors = computed(
  () => project.value?.can_accept_contributors === true
)
const isProjectOwner = computed(() =>
  Boolean(user.value && project.value?.owner_id === user.value.id)
)
const isInitiatorOrganizationAdmin = computed(() =>
  Boolean(
    user.value &&
    project.value?.initiator_organization_id &&
    user.value.initiableOrganizations?.some(
      (organization) =>
        organization.id === project.value?.initiator_organization_id
    )
  )
)
const canEditDefinition = computed(() =>
  project.value
    ? isProjectDefinitionEditableBy(project.value, user.value)
    : false
)

const totalRoleCapacity = computed(() => {
  const total =
    project.value?.project_roles?.reduce(
      (acc, role) => (role.status === 'archived' ? acc : acc + role.capacity),
      0
    ) ?? 0
  return total
})

const openSlots = computed(() => {
  return (
    project.value?.project_roles?.reduce(
      (total, role) =>
        role.status === 'archived'
          ? total
          : total + Math.max(role.remaining_capacity, 0),
      0
    ) ?? 0
  )
})

const availableRoles = computed(
  () =>
    project.value?.project_roles?.filter(
      (role) => role.status === 'open' && role.remaining_capacity > 0
    ) ?? []
)

const roleAvailabilityClass = (role: ProjectRole) =>
  role.remaining_capacity > 0
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : 'bg-neutral-100 text-neutral-600 border border-neutral-200'

const roleAvailabilityLabel = (role: ProjectRole) =>
  role.remaining_capacity > 0
    ? `${role.remaining_capacity} slot tersedia`
    : 'Slot penuh'

const visibleRoles = computed(
  () =>
    project.value?.project_roles?.filter(
      (role) => role.status !== 'archived'
    ) ?? []
)

const canApply = computed(() => {
  const currentProject = project.value
  if (!currentProject) return false
  const hasActiveApplication = ['pending', 'accepted'].includes(
    currentProject.viewer_application?.status ?? ''
  )
  return (
    currentProject.status === 'open' &&
    currentProject.visibility === 'public' &&
    currentProject.owner_id !== null &&
    currentProject.owner_id !== undefined &&
    availableRoles.value.length > 0 &&
    !isProjectOwner.value &&
    !isInitiatorOrganizationAdmin.value &&
    !hasActiveApplication
  )
})

const formatDate = (date: string | null | undefined) => {
  if (!date) return null
  const d = new Date(date)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formattedDeadline = computed(() => formatDate(project.value?.deadline))
const formattedStartDate = computed(() => formatDate(project.value?.start_date))

const creatorName = computed(
  () =>
    project.value?.owner_profile?.full_name ||
    project.value?.owner_profile?.username ||
    'Project Lead belum ditetapkan'
)

const creatorUsername = computed(() => project.value?.owner_profile?.username)
const creatorInitial = computed(() => {
  const parts = creatorName.value.trim().split(/\s+/)
  const first = parts[0]
  const second = parts[1]
  if (parts.length >= 2 && first && second) {
    return (first.charAt(0) + second.charAt(0)).toUpperCase()
  }
  return creatorName.value.slice(0, 2).toUpperCase()
})
const creatorAvatar = computed(
  () => project.value?.owner_profile?.avatar ?? null
)
const creatorAttribution = computed(() => project.value
  ? getProjectOwnerAttribution(project.value)
  : 'Kepemilikan belum ditetapkan'
)
const isCreatorVerified = computed(
  () => project.value?.owner_profile?.is_verified ?? false
)

const originLabels: Record<string, string> = {
  personal: 'Proyek pribadi',
  community: 'Komunitas',
  experiment: 'Eksperimen',
  client: 'Proyek klien'
}

const projectOriginLabel = computed(() => {
  if (project.value?.origin && originLabels[project.value.origin]) {
    return originLabels[project.value.origin]
  }
  return 'Proyek pribadi'
})

const projectCreationModeLabel = computed(() =>
  project.value?.creation_mode === 'organization_initiated'
    ? 'Inisiatif organisasi'
    : 'Proyek personal'
)

const collaborationFormatLabel = computed(() =>
  getProjectCategoryLabel(project.value?.project_category ?? 'other')
)

const statusBadgeText = computed(() => {
  if (project.value?.status === 'open') {
    if (visibleRoles.value.length === 0) return 'Belum ada peran kontributor'
    if (openSlots.value === 0) return 'Kuota terpenuhi'
    return canAcceptContributors.value
      ? 'Terbuka untuk kontributor'
      : 'Proyek terbuka'
  }
  if (project.value?.status === 'awaiting_owner') return 'Menunggu Project Lead'
  if (project.value?.status === 'in_progress') return 'Sedang berjalan'
  if (project.value?.status === 'completed') return 'Selesai'
  if (project.value?.status === 'draft') return 'Draf'
  return 'Diarsipkan'
})

const statusBadgeClass = computed(() => {
  switch (project.value?.status) {
    case 'open':
      return openSlots.value > 0
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
    case 'in_progress':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'completed':
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'draft':
      return 'bg-neutral-100 text-neutral-700 border border-neutral-200'
    case 'awaiting_owner':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    default:
      return 'bg-neutral-100 text-neutral-600 border border-neutral-200'
  }
})

const statusLabel = computed(() => {
  switch (project.value?.status) {
    case 'open':
      if (visibleRoles.value.length === 0) return 'Belum ada peran kontributor'
      if (openSlots.value === 0) return 'Kuota terpenuhi'
      return canAcceptContributors.value
        ? 'Terbuka'
        : 'Tidak menerima kontributor'
    case 'in_progress':
      return 'Sedang Berjalan'
    case 'completed':
      return 'Selesai'
    case 'draft':
      return 'Draf'
    case 'awaiting_owner':
      return 'Menunggu Project Lead'
    default:
      return 'Diarsipkan'
  }
})

const commitmentLabel = computed(() => {
  return project.value?.hours_per_week
    ? `± ${project.value.hours_per_week} jam/minggu`
    : 'Belum ditentukan'
})

const availabilityLabels: Record<string, string> = {
  flexible: 'Fleksibel',
  part_time: 'Paruh waktu',
  weekends_only: 'Akhir pekan',
  full_time: 'Penuh waktu'
}
const availabilityLabel = computed(
  () =>
    availabilityLabels[project.value?.availability ?? ''] ?? 'Belum ditentukan'
)

const teamCountLabel = computed(() => {
  const currentCount =
    project.value?.project_roles?.reduce(
      (total, role) => total + role.filled_capacity,
      0
    ) ?? 0
  return `${currentCount} / ${totalRoleCapacity.value} orang`
})

const collaborativeReason = computed(() => {
  return project.value?.why_collaborative || project.value?.why_join || ''
})

const ownerCommitmentHeading = computed(() =>
  project.value?.creation_mode === 'organization_initiated'
    ? 'Ekspektasi untuk Project Lead'
    : 'Komitmen pemilik proyek'
)
const ownerCommitmentText = computed(() =>
  project.value?.creation_mode === 'organization_initiated'
    ? project.value.lead_expectations || ''
    : project.value?.owner_commitment || ''
)

const descriptionParagraphs = computed(() => {
  const description = project.value?.description?.trim() || ''
  return description
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
})

const getRoleTags = (role: ProjectRole): string[] => {
  const toolNames = role.tools?.map((tool) => tool.name) || []
  const skillNames = Array.isArray(role.skill_tags) ? role.skill_tags : []
  const tags = [...new Set([...toolNames, ...skillNames])]
  if (tags.length > 0) return tags
  if (project.value?.project_technologies?.length) {
    return project.value.project_technologies
      .map((t) => t.tool.name)
      .slice(0, 4)
  }
  return []
}

const contributorOutcome = computed(() =>
  project.value ? getProjectContributorOutcome(project.value) : null
)

const transparencyItems = computed(() =>
  [
    'Status proyek tersedia',
    project.value?.why_collaborative ? 'Tujuan kolaborasi dijelaskan' : '',
    visibleRoles.value.length ? 'Peran kontributor tersedia' : ''
  ].filter(Boolean)
)

const applicationStatusCopy = computed(() =>
  getProjectApplicationStatusCopy(project.value?.viewer_application?.status)
)
const applicationUnavailableTitle = computed(() =>
  getProjectApplicationUnavailableTitle({
    projectStatus: project.value?.status,
    applicationStatus: project.value?.viewer_application?.status,
    isProjectOwner: isProjectOwner.value,
    isInitiatorOrganizationAdmin: isInitiatorOrganizationAdmin.value
  })
)
const applicationUnavailableMessage = computed(() => {
  if (applicationStatusCopy.value) return applicationStatusCopy.value.message
  if (isProjectOwner.value) return 'Kamu adalah Project Lead proyek ini.'
  if (isInitiatorOrganizationAdmin.value)
    return 'Organisasimu menginisiasi proyek ini.'
  if (!user.value) return 'Masuk ke akunmu untuk mengajukan kontribusi.'
  return project.value
    ? getProjectContributionAvailabilityMessage(
        project.value.status,
        project.value.visibility,
        openSlots.value,
        visibleRoles.value.length,
        Boolean(project.value.owner_id)
      )
    : ''
})
const applicationUnavailableVariant = computed(() => {
  switch (project.value?.status) {
    case 'awaiting_owner':
    case 'draft':
      return 'warning' as const
    case 'completed':
    case 'archived':
    case 'in_progress':
      return 'info' as const
    default:
      return 'warning' as const
  }
})

const showApplyModal = ref(false)
const handleApplied = () => refreshProject()

// Mobile scroll listener for sticky bottom bar
const heroSection = ref<HTMLElement | null>(null)
const showStickyBar = ref(false)
let scrollHandler: () => void

const isMobile = ref(false)
const updateIsMobile = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 1024
  }
}

const setupScrollListener = () => {
  updateIsMobile()
  scrollHandler = () => {
    const hero = heroSection.value
    showStickyBar.value = Boolean(
      isMobile.value && hero && hero.getBoundingClientRect().bottom <= 40
    )
  }
  window.addEventListener('scroll', scrollHandler, { passive: true })
  window.addEventListener(
    'resize',
    () => {
      updateIsMobile()
      scrollHandler()
    },
    { passive: true }
  )
}

watch(
  heroSection,
  () => {
    if (scrollHandler) scrollHandler()
  },
  { flush: 'post' }
)

onMounted(() => {
  setupScrollListener()
  if (scrollHandler) scrollHandler()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
  }
})
</script>
