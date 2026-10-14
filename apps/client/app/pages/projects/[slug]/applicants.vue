<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ArrowDownUp, ChevronDown, Funnel, SlidersHorizontal } from '@lucide/vue'
import { useInfiniteScroll } from '~/composables/useInfiniteScroll'
import { useProjectApplicants } from '~/composables/useProjectApplicants'
import { ApplicationService } from '~/services/application.service'
import { ProjectService } from '~/services/project.service'
import { toProjectDetailView } from '~/utils/project-presentation'
import { toApplicantCardView, type ApplicantCardView } from '~/utils/application-presentation'
import type { ApplicationListQuery, ApplicationStatus } from '~/types/application'
import type { Project } from '~/types/project'
import ApplicantDetailModal from '~/components/project/ApplicantDetailModal.vue'

definePageMeta({ layout: 'home', middleware: ['auth'] })
const route = useRoute()
const toast = useToast()
const projectSlug = computed(() => String(route.params.slug ?? ''))
const { currentUserId } = useAuth()
const accountId = computed(() => currentUserId.value)
const project = ref<Project | null>(null)
useHead(() => ({ title: project.value ? `Pelamar: ${project.value.title} — Kolaboria` : 'Kelola Pelamar — Kolaboria' }))
const projectError = ref<unknown>(null)
const projectPending = ref(false)
const query = ref<ApplicationListQuery>({ page: 1, limit: 5, sort: 'newest' })
const selectedStatuses = ref<ApplicationStatus[]>([])
const selectedRoles = ref<string[]>([])
const searchQuery = ref('')
const searchInput = ref('')
const sortOrder = ref<'newest' | 'oldest'>('newest')
const isMobileFilterOpen = ref(false)
const isMobileSortOpen = ref(false)
const isMobileStatusFilterOpen = ref(false)
const isMobileRoleFilterOpen = ref(false)
const isModalOpen = ref(false)
const isDesktop = ref(false)
const currentPage = ref(1)
const pageSize = 5
let mediaQuery: MediaQueryList | null = null
let projectRequest = 0

watch([selectedStatuses, selectedRoles, searchQuery, sortOrder], () => {
  query.value = {
    page: 1,
    limit: pageSize,
    search: searchQuery.value || undefined,
    statuses: [...selectedStatuses.value],
    project_role_ids: [...selectedRoles.value],
    sort: sortOrder.value
  }
  currentPage.value = 1
}, { deep: true })

const projectId = computed(() => project.value?.id ?? null)
const applicants = useProjectApplicants(accountId, projectId, query, ApplicationService)
const summary = applicants.summary
const applications = computed(() => applicants.items.value.map(toApplicantCardView))
const filteredApplications = applications
const selectedApplicant = applicants.detail
const isSubmitting = applicants.submitting
const isLoading = computed(() => projectPending.value || applicants.pending.value)
const stats = computed(() => summary.value?.stats ?? { total: 0, pending: 0, accepted: 0, rejected: 0, withdrawn: 0 })
const totalCapacity = computed(() => summary.value?.capacity.total_capacity ?? 0)
const filledCapacity = computed(() => summary.value?.capacity.filled_capacity ?? 0)
const capacityProgress = computed(() => totalCapacity.value ? Math.min(100, (filledCapacity.value / totalCapacity.value) * 100) : 0)
const roleOptions = computed(() => (summary.value?.roles ?? []).map((role) => ({ value: role.id, label: role.name })))
const totalPages = computed(() => Math.max(1, applicants.meta.value?.total_pages ?? 0))
const hasMoreMobile = applicants.hasMore
const displayedApplications = applications
const displayedCount = computed(() => displayedApplications.value.length)
const filteredTotal = computed(() => applicants.meta.value?.total ?? 0)
const error = applicants.error
const loadMoreError = applicants.loadMoreError

const filters: Array<{ label: string; value: ApplicationStatus }> = [
  { label: 'Menunggu', value: 'pending' },
  { label: 'Diterima', value: 'accepted' },
  { label: 'Ditolak', value: 'rejected' },
  { label: 'Dibatalkan', value: 'withdrawn' }
]
const sortOptions = [
  { label: 'Terbaru', value: 'newest' },
  { label: 'Terlama', value: 'oldest' }
]
const availabilityLabels: Record<string, string> = {
  flexible: 'Fleksibel', full_time: 'Penuh waktu', part_time: 'Paruh waktu', weekends_only: 'Hanya akhir pekan'
}
const statusConfig: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Menunggu', classes: 'bg-accent-50 text-accent-800 ring-accent-200' },
  accepted: { label: 'Diterima', classes: 'bg-success-50 text-success-700 ring-success-200' },
  rejected: { label: 'Ditolak', classes: 'bg-danger-50 text-danger-700 ring-danger-200' },
  withdrawn: { label: 'Dibatalkan', classes: 'bg-neutral-100 text-neutral-600 ring-neutral-200' }
}
const projectStatusLabel = computed(() => ({
  open: 'Menerima Kontributor', awaiting_owner: 'Menunggu Project Lead', in_progress: 'Sedang berjalan',
  completed: 'Selesai', archived: 'Diarsipkan', draft: 'Draf'
}[project.value?.status || 'draft']))
const isAllStatusesSelected = computed(() => selectedStatuses.value.length === 0)
const isAllRolesSelected = computed(() => selectedRoles.value.length === 0)
const activeFilterCount = computed(() => selectedStatuses.value.length + selectedRoles.value.length)
const statusFilterLabel = computed(() => selectedStatuses.value.length ? `${selectedStatuses.value.length} Status` : 'Status')
const roleFilterLabel = computed(() => selectedRoles.value.length ? `${selectedRoles.value.length} Posisi` : 'Posisi')
const getName = (application: ApplicantCardView) => application.applicant_profile?.full_name || application.applicant_profile?.username || 'Talent Kolaboria'
const getRoleName = (application: ApplicantCardView) => application.project_role.contribution_role?.name || 'Kontributor'
const formatDate = (value: string) => new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const toggleAllStatuses = (checked: boolean) => { if (checked) selectedStatuses.value = [] }
const toggleStatus = (status: ApplicationStatus) => {
  selectedStatuses.value = selectedStatuses.value.includes(status) ? selectedStatuses.value.filter((item) => item !== status) : [...selectedStatuses.value, status]
}
const toggleAllRoles = (checked: boolean) => { if (checked) selectedRoles.value = [] }
const toggleRole = (roleId: string) => {
  selectedRoles.value = selectedRoles.value.includes(roleId) ? selectedRoles.value.filter((item) => item !== roleId) : [...selectedRoles.value, roleId]
}
const resetListPosition = () => { currentPage.value = 1 }
const resetFilters = () => {
  selectedStatuses.value = []; selectedRoles.value = []; searchQuery.value = ''; searchInput.value = ''; sortOrder.value = 'newest'; resetListPosition()
}
const onLoadMore = () => applicants.loadMore()
const { sentinelRef, isLoading: loadingMore } = useInfiniteScroll({ onLoadMore, hasMore: hasMoreMobile, disabled: computed(() => isDesktop.value), distance: '180px' })

watch(currentPage, (page) => {
  if (isDesktop.value && page > 0 && page !== applicants.meta.value?.page) void applicants.loadPage(page)
})
const handleMediaChange = (event: MediaQueryListEvent | MediaQueryList) => {
  isDesktop.value = event.matches
  currentPage.value = 1
}
onMounted(() => {
  mediaQuery = window.matchMedia('(min-width: 1024px)')
  isDesktop.value = mediaQuery.matches
  mediaQuery.addEventListener('change', handleMediaChange)
  void loadProject()
})
onUnmounted(() => mediaQuery?.removeEventListener('change', handleMediaChange))
watch(projectSlug, () => { void loadProject() })

async function loadProject() {
  const request = ++projectRequest
  projectPending.value = true
  projectError.value = null
  project.value = null
  try {
    const response = await ProjectService.getProjectBySlug(projectSlug.value)
    if (request !== projectRequest) return
    if (!response.data) throw new Error('Proyek tidak ditemukan.')
    project.value = toProjectDetailView(response.data)
  } catch (failure) {
    if (request === projectRequest) projectError.value = failure
  } finally {
    if (request === projectRequest) projectPending.value = false
  }
}

const openModal = async (application: ApplicantCardView) => {
  await applicants.openDetail(application.id)
  if (applicants.detail.value) isModalOpen.value = true
  else toast.error('Detail pengajuan belum dapat dimuat.')
}
const closeModal = () => { isModalOpen.value = false; applicants.closeDetail() }
const handleReviewed = async (status: 'accepted' | 'rejected', note: string) => {
  try {
    await applicants.review(status, note)
    closeModal()
  } catch {
    toast.error('Keputusan belum tersimpan. Periksa koneksi dan coba lagi.')
  }
}
const retryLoad = () => projectError.value ? loadProject() : applicants.refresh()
</script>

<template>
  <main v-if="project && !projectError" class="min-h-screen bg-neutral-50 pb-10 pt-5 sm:pt-8">
    <div class="mx-auto max-w-7xl">
      <nav
        class="mb-4 flex items-center gap-2 font-body-3 text-neutral-500"
        aria-label="Breadcrumb"
      >
        <NuxtLink to="/projects/my-projects" class="hover:text-primary-700"
          >Proyek Saya</NuxtLink
        >
        <span aria-hidden="true">/</span>
        <NuxtLink
          :to="`/projects/${projectSlug}`"
          class="hover:text-primary-700"
          >Detail Proyek</NuxtLink
        >
        <span aria-hidden="true">/</span>
        <span class="text-neutral-700" aria-current="page">Kelola Pelamar</span>
      </nav>

      <header
        class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 class="font-title-1 text-primary">Kelola Pelamar</h1>
          <p class="mt-1 font-paragraph-3 text-secondary">
            Tinjau pengajuan dan pilih kontributor untuk proyek ini.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink
            :to="`/projects/${projectSlug}`"
            custom
            v-slot="{ navigate }"
          >
            <AtomicButton
              variant="outline"
              size="sm"
              class="self-start sm:self-auto"
              @click="navigate"
            >
              <template #icon-left
                ><Icon
                  name="lucide:arrow-left"
                  class="h-4 w-4"
                  aria-hidden="true"
              /></template>
              Kembali ke Proyek
            </AtomicButton>
          </NuxtLink>
        </div>
      </header>

      <OrganismCard
        padding="none"
        class="mb-3 rounded-xl border border-neutral-200 shadow-none"
        aria-label="Ringkasan proyek"
      >
        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0 p-4 sm:p-5">
            <h2 class="font-label-3 uppercase tracking-wider text-neutral-500">
              Proyek yang dikelola
            </h2>
            <p class="mt-1 truncate font-title-3 text-primary">
              {{ project.title }}
            </p>
            <div
              class="mt-2 flex flex-wrap items-center gap-2 font-body-3 text-secondary"
            >
              <span
                class="rounded-full bg-primary-50 px-2.5 py-1 font-label-3 text-primary-700"
                >{{ projectStatusLabel }}</span
              >
              <span class="text-neutral-300" aria-hidden="true">•</span>
              <span>{{
                project.creation_mode === 'organization_initiated'
                  ? project.initiator_organization?.name || 'Proyek organisasi'
                  : 'Proyek pribadi'
              }}</span>
              <span class="text-neutral-300" aria-hidden="true">•</span>
              <span>{{ totalCapacity }} posisi</span>
            </div>
          </div>
          <div
            class="w-full shrink-0 border-t border-neutral-100 px-4 pb-4 pt-3 sm:w-44 sm:border-l sm:border-t-0 sm:px-5 sm:py-5 sm:text-right"
          >
            <p class="font-label-2 text-primary">
              {{ filledCapacity }} dari {{ totalCapacity }} slot terisi
            </p>
            <p class="mt-0.5 font-body-3 text-secondary">
              Kapasitas kontributor
            </p>
            <div
              class="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100"
              role="progressbar"
              :aria-valuenow="filledCapacity"
              :aria-valuemin="0"
              :aria-valuemax="totalCapacity"
              aria-label="Kapasitas kontributor"
            >
              <div
                class="h-full rounded-full bg-primary-600 transition-[width]"
                :style="{ width: `${capacityProgress}%` }"
              />
            </div>
          </div>
        </div>
      </OrganismCard>

      <section class="mb-7" aria-labelledby="application-summary-heading">
        <div class="mb-3">
          <h2
            id="application-summary-heading"
            class="font-title-3 text-primary"
          >
            Ringkasan Pengajuan
          </h2>
          <p class="mt-1 font-body-3 text-secondary">
            Pantau jumlah pelamar dan lihat pengajuan yang masih perlu ditinjau.
          </p>
        </div>

        <div
          class="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3"
          aria-label="Statistik pengajuan"
        >
          <OrganismCard
            padding="none"
            class="rounded-xl border border-neutral-200 shadow-none"
          >
            <div class="p-3 sm:p-4">
              <p class="font-body-3 text-secondary">Total Pengajuan</p>
              <p class="mt-1 font-title-2 tabular-nums text-primary">
                {{ stats.total }}
              </p>
              <p class="mt-1 font-body-3 text-neutral-500">Seluruh pengajuan</p>
            </div>
          </OrganismCard>
          <OrganismCard
            padding="none"
            class="rounded-xl border border-neutral-200 shadow-none"
          >
            <div class="p-3 sm:p-4">
              <p class="font-body-3 text-secondary">Menunggu</p>
              <p class="mt-1 font-title-2 tabular-nums text-accent-800">
                {{ stats.pending }}
              </p>
              <p class="mt-1 font-body-3 text-neutral-500">Perlu ditinjau</p>
            </div>
          </OrganismCard>
          <OrganismCard
            padding="none"
            class="rounded-xl border border-neutral-200 shadow-none"
          >
            <div class="p-3 sm:p-4">
              <p class="font-body-3 text-secondary">Diterima</p>
              <p class="mt-1 font-title-2 tabular-nums text-success-700">
                {{ stats.accepted }}
              </p>
              <p class="mt-1 font-body-3 text-neutral-500">Bergabung ke tim</p>
            </div>
          </OrganismCard>
          <OrganismCard
            padding="none"
            class="rounded-xl border border-neutral-200 shadow-none"
          >
            <div class="p-3 sm:p-4">
              <p class="font-body-3 text-secondary">Ditolak</p>
              <p class="mt-1 font-title-2 tabular-nums text-primary">
                {{ stats.rejected }}
              </p>
              <p class="mt-1 font-body-3 text-neutral-500">Tidak dilanjutkan</p>
            </div>
          </OrganismCard>
        </div>
      </section>

      <section aria-labelledby="applications-heading">
        <div class="mb-3">
          <h2 id="applications-heading" class="font-title-3 text-primary">
            Pengajuan Kontributor
          </h2>
          <p class="mt-1 font-body-3 text-secondary">
            Semua pengajuan untuk proyek ini, berdasarkan posisi dan statusnya.
          </p>
        </div>

        <div class="flex flex-col items-start gap-6 lg:flex-row lg:gap-8">
          <aside
            class="hidden w-64 shrink-0 space-y-5 self-start rounded-xl border border-neutral-200 bg-white p-5 lg:sticky lg:top-20 lg:block"
            aria-label="Filter pengajuan"
          >
            <div
              class="flex items-center justify-between border-b border-neutral-100 pb-3"
            >
              <div class="flex items-center gap-2">
                <SlidersHorizontal
                  class="h-4 w-4 text-neutral-600"
                  aria-hidden="true"
                />
                <span class="font-label-1 font-bold text-primary">Filter</span>
                <span
                  v-if="activeFilterCount"
                  class="rounded-full bg-primary-50 px-2 py-0.5 font-body-3 font-semibold text-primary-700"
                  >{{ activeFilterCount }}</span
                >
              </div>
              <button
                v-if="activeFilterCount"
                type="button"
                class="font-body-3 text-neutral-500 transition-colors hover:text-primary-700"
                @click="resetFilters"
              >
                Reset
              </button>
            </div>

            <div>
              <h3 class="mb-3 font-label-2 font-bold text-primary">
                Status pengajuan
              </h3>
              <div class="flex flex-col gap-2.5">
                <AtomicCheckbox
                  label="Semua status"
                  :model-value="isAllStatusesSelected"
                  @update:model-value="toggleAllStatuses"
                />
                <AtomicCheckbox
                  v-for="filter in filters"
                  :key="filter.value"
                  :label="`${filter.label} (${stats[filter.value]})`"
                  :model-value="selectedStatuses.includes(filter.value)"
                  @update:model-value="() => toggleStatus(filter.value)"
                />
              </div>
            </div>

            <div class="border-b border-neutral-100" />

            <div>
              <h3 class="mb-3 font-label-2 font-bold text-primary">Posisi</h3>
              <div class="flex flex-col gap-2.5">
                <AtomicCheckbox
                  label="Semua posisi"
                  :model-value="isAllRolesSelected"
                  @update:model-value="toggleAllRoles"
                />
                <AtomicCheckbox
                  v-for="role in roleOptions"
                  :key="role.value"
                  :label="role.label"
                  :model-value="selectedRoles.includes(role.value)"
                  @update:model-value="() => toggleRole(role.value)"
                />
              </div>
            </div>
          </aside>

          <div class="min-w-0 w-full flex-1">
            <div class="mb-4 hidden items-center justify-between gap-4 lg:flex">
              <p class="font-body-2 text-secondary">
                Menampilkan
                <strong>{{ filteredTotal }}</strong> pengajuan
              </p>
              <div class="w-48 shrink-0">
                <MoleculeDropdown
                  v-model="sortOrder"
                  :options="sortOptions"
                  placeholder="Terbaru"
                />
              </div>
            </div>

            <div class="mb-4 block lg:hidden">
              <p class="mb-3 font-body-2 text-secondary">
                Menampilkan {{ displayedCount }} dari
                {{ filteredTotal }} pengajuan
              </p>
              <div
                class="-mx-1 flex items-center gap-2 overflow-x-auto px-1 py-2 scrollbar-none"
              >
                <button
                  type="button"
                  class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 transition-colors hover:bg-neutral-50"
                  aria-label="Buka semua filter"
                  @click="isMobileFilterOpen = true"
                >
                  <Funnel class="h-4.5 w-4.5" aria-hidden="true" />
                  <span
                    v-if="activeFilterCount"
                    class="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary-600 px-1 font-body-3 text-white ring-2 ring-white"
                    >{{ activeFilterCount }}</span
                  >
                </button>
                <button
                  type="button"
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors"
                  :class="
                    sortOrder !== 'newest'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                  "
                  aria-label="Urutkan pengajuan"
                  @click="isMobileSortOpen = true"
                >
                  <ArrowDownUp class="h-4.5 w-4.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 font-label-2 transition-colors"
                  :class="
                    selectedStatuses.length
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-300 bg-white text-neutral-800'
                  "
                  @click="isMobileStatusFilterOpen = true"
                >
                  {{ statusFilterLabel
                  }}<ChevronDown
                    class="h-3.5 w-3.5 text-neutral-500"
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 font-label-2 transition-colors"
                  :class="
                    selectedRoles.length
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-300 bg-white text-neutral-800'
                  "
                  @click="isMobileRoleFilterOpen = true"
                >
                  {{ roleFilterLabel
                  }}<ChevronDown
                    class="h-3.5 w-3.5 text-neutral-500"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            <div class="mb-4">
              <MoleculeSearchField
                v-model="searchInput"
                @search="searchQuery = $event"
                placeholder="Cari nama, skill, atau kontribusi (minimal 3 karakter)..."
                aria-label="Cari nama, skill, atau kontribusi"
              />
            </div>

            <div v-if="isLoading" class="rounded-xl border border-neutral-200 bg-white p-8 text-center font-body-2 text-secondary" role="status">
              Memuat data pelamar...
            </div>
            <div v-else-if="error" class="rounded-xl border border-danger-200 bg-white p-6 text-center">
              <p class="font-label-2 text-primary">Data pelamar belum dapat dimuat</p>
              <p class="mt-1 font-body-3 text-secondary">Coba lagi untuk memuat data terbaru.</p>
              <AtomicButton class="mt-4" variant="outline" @click="retryLoad">Coba lagi</AtomicButton>
            </div>
            <div v-else-if="displayedApplications.length" class="space-y-3">
              <OrganismCard
                v-for="application in displayedApplications"
                :key="application.id"
                padding="none"
                class="rounded-xl border border-neutral-200 shadow-none transition-colors hover:border-primary-300"
              >
                <div class="flex flex-col p-4 sm:p-5">
                  <div class="flex items-start gap-3.5 sm:gap-4">
                    <div
                      class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-50 font-label-2 text-primary-700"
                    >
                      <img
                        v-if="application.profiles?.avatar"
                        :src="application.profiles.avatar"
                        :alt="`Foto ${getName(application)}`"
                        class="h-full w-full object-cover"
                      />
                      <span v-else>{{
                        getName(application)
                          .slice(0, 2)
                          .toLocaleUpperCase('id-ID')
                      }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div
                        class="flex flex-wrap items-center gap-x-2 gap-y-1.5"
                      >
                        <h3 class="truncate font-label-1 text-primary">
                          {{ getName(application) }}
                        </h3>
                        <span
                          :class="[
                            'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-label-3 ring-1 ring-inset',
                            statusConfig[application.status]?.classes
                          ]"
                          >{{
                            statusConfig[application.status]?.label ||
                            application.status
                          }}</span
                        >
                      </div>
                      <p class="mt-1 line-clamp-1 font-body-3 text-secondary">
                        {{
                          application.profiles?.headline ||
                          getRoleName(application)
                        }}
                      </p>

                      <dl
                        class="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body-3 text-secondary"
                      >
                        <div class="inline-flex items-center gap-1.5">
                          <dt class="text-neutral-500">Posisi</dt>
                          <dd class="font-label-3 text-primary">
                            {{ getRoleName(application) }}
                          </dd>
                        </div>
                        <div class="inline-flex items-center gap-1.5">
                          <dt class="text-neutral-500">Waktu</dt>
                          <dd>
                            {{
                              availabilityLabels[application.availability] ||
                              application.availability
                            }}<template
                              v-if="application.estimated_hours_per_week"
                            >
                              ·
                              {{ application.estimated_hours_per_week }}
                              jam/minggu</template
                            >
                          </dd>
                        </div>
                      </dl>

                      <div
                        v-if="
                          application.project_role?.skill_tags?.length ||
                          application.project_role?.tools?.length
                        "
                        class="mt-2.5 flex flex-wrap gap-1.5"
                        aria-label="Skill dan tools posisi"
                      >
                        <span
                          v-for="skill in application.project_role
                            ?.skill_tags || []"
                          :key="skill"
                          class="rounded-md bg-neutral-100 px-2 py-1 font-body-3 text-neutral-600"
                          >{{ skill }}</span
                        >
                        <span
                          v-for="tool in application.project_role?.tools || []"
                          :key="tool.id"
                          class="rounded-md bg-neutral-100 px-2 py-1 font-body-3 text-neutral-600"
                          >{{ tool.name }}</span
                        >
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="
                      application.expected_contribution ||
                      application.motivation
                    "
                    class="mt-4 sm:ml-[3.75rem]"
                  >
                    <p class="font-label-3 text-neutral-600">
                      {{
                        application.expected_contribution
                          ? 'Kontribusi yang ditawarkan'
                          : 'Motivasi pelamar'
                      }}
                    </p>
                    <p
                      class="mt-1 line-clamp-2 font-body-3 leading-relaxed text-secondary"
                    >
                      {{
                        application.expected_contribution ||
                        application.motivation
                      }}
                    </p>
                  </div>

                  <div
                    class="mt-4 flex flex-col items-start gap-2 border-t border-neutral-100 pt-3 sm:ml-[3.75rem] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span class="font-body-3 text-neutral-500"
                      >Diajukan {{ formatDate(application.applied_at) }}</span
                    >
                    <AtomicButton
                      size="sm"
                      variant="ghost-primary"
                      class="self-end sm:self-auto"
                      @click="openModal(application)"
                      >Lihat Pengajuan
                      <template #icon-right
                        ><Icon
                          name="lucide:arrow-right"
                          class="h-4 w-4"
                          aria-hidden="true" /></template
                    ></AtomicButton>
                  </div>
                </div>
              </OrganismCard>
            </div>

            <OrganismEmptyState
              v-else
              title="Belum ada pengajuan"
              :description="
                searchQuery || selectedRoles.length || selectedStatuses.length
                  ? 'Coba ubah kata kunci atau filter yang dipilih.'
                  : 'Pengajuan dari kontributor akan muncul di sini.'
              "
            />

            <div v-if="isDesktop && totalPages > 1" class="mt-5">
              <MoleculePagination
                v-model="currentPage"
                :total-pages="totalPages"
                :total-items="filteredTotal"
                :per-page="pageSize"
                align="end"
              />
            </div>
            <div
              v-if="!isDesktop && hasMoreMobile"
              ref="sentinelRef"
              class="flex justify-center py-5"
              aria-live="polite"
            >
              <span
                v-if="loadingMore"
                class="font-body-3 text-secondary"
                role="status"
                >Memuat pengajuan lainnya...</span
              >
              <span v-else class="font-body-3 text-neutral-400"
                >Gulir untuk melihat pengajuan lainnya</span
              >
            </div>
          </div>
        </div>

        <OrganismBottomSheet
          v-model="isMobileSortOpen"
          title="Urutkan Pengajuan"
          subtitle="Pilih urutan daftar pelamar"
          primary-label="Terapkan"
          secondary-label="Reset"
          @primary="isMobileSortOpen = false"
          @secondary="sortOrder = 'newest'"
        >
          <div class="flex flex-col gap-4 py-2">
            <AtomicRadio
              v-for="option in sortOptions"
              :key="option.value"
              v-model="sortOrder"
              :value="option.value"
              :label="option.label"
              name="applicant-sort-option"
            />
          </div>
        </OrganismBottomSheet>

        <OrganismBottomSheet
          v-model="isMobileFilterOpen"
          title="Filter Pengajuan"
          subtitle="Pilih status dan posisi pelamar"
          primary-label="Terapkan"
          secondary-label="Reset Semua"
          @primary="isMobileFilterOpen = false"
          @secondary="resetFilters"
        >
          <div class="space-y-6 py-2">
            <div>
              <h3 class="mb-3 font-label-1 font-bold text-primary">
                Status pengajuan
              </h3>
              <div class="flex flex-col gap-3">
                <AtomicCheckbox
                  label="Semua status"
                  :model-value="isAllStatusesSelected"
                  @update:model-value="toggleAllStatuses"
                />
                <AtomicCheckbox
                  v-for="filter in filters"
                  :key="filter.value"
                  :label="`${filter.label} (${stats[filter.value]})`"
                  :model-value="selectedStatuses.includes(filter.value)"
                  @update:model-value="() => toggleStatus(filter.value)"
                />
              </div>
            </div>
            <div class="border-b border-neutral-100" />
            <div>
              <h3 class="mb-3 font-label-1 font-bold text-primary">Posisi</h3>
              <div class="flex flex-col gap-3">
                <AtomicCheckbox
                  label="Semua posisi"
                  :model-value="isAllRolesSelected"
                  @update:model-value="toggleAllRoles"
                />
                <AtomicCheckbox
                  v-for="role in roleOptions"
                  :key="role.value"
                  :label="role.label"
                  :model-value="selectedRoles.includes(role.value)"
                  @update:model-value="() => toggleRole(role.value)"
                />
              </div>
            </div>
          </div>
        </OrganismBottomSheet>

        <OrganismBottomSheet
          v-model="isMobileStatusFilterOpen"
          title="Status Pengajuan"
          subtitle="Pilih satu atau beberapa status"
          primary-label="Terapkan"
          secondary-label="Reset"
          @primary="isMobileStatusFilterOpen = false"
          @secondary="toggleAllStatuses(true)"
        >
          <div class="flex flex-col gap-3.5 py-2">
            <AtomicCheckbox
              label="Semua status"
              :model-value="isAllStatusesSelected"
              @update:model-value="toggleAllStatuses"
            />
            <AtomicCheckbox
              v-for="filter in filters"
              :key="filter.value"
              :label="`${filter.label} (${stats[filter.value]})`"
              :model-value="selectedStatuses.includes(filter.value)"
              @update:model-value="() => toggleStatus(filter.value)"
            />
          </div>
        </OrganismBottomSheet>

        <OrganismBottomSheet
          v-model="isMobileRoleFilterOpen"
          title="Posisi Pelamar"
          subtitle="Pilih posisi yang dilamar"
          primary-label="Terapkan"
          secondary-label="Reset"
          @primary="isMobileRoleFilterOpen = false"
          @secondary="toggleAllRoles(true)"
        >
          <div class="flex flex-col gap-3.5 py-2">
            <AtomicCheckbox
              label="Semua posisi"
              :model-value="isAllRolesSelected"
              @update:model-value="toggleAllRoles"
            />
            <AtomicCheckbox
              v-for="role in roleOptions"
              :key="role.value"
              :label="role.label"
              :model-value="selectedRoles.includes(role.value)"
              @update:model-value="() => toggleRole(role.value)"
            />
          </div>
        </OrganismBottomSheet>
      </section>
    </div>

    <ApplicantDetailModal
      v-model="isModalOpen"
      :application="selectedApplicant"
      :submitting="isSubmitting"
      @reviewed="handleReviewed"
      @close="closeModal"
    />
  </main>
  <main v-else class="mx-auto min-h-[60vh] max-w-3xl px-4 py-16 text-center">
    <p v-if="projectPending" class="font-body-2 text-secondary" role="status">Memuat proyek...</p>
    <div v-else>
      <p class="font-title-3 text-primary">Proyek tidak dapat dimuat</p>
      <p class="mt-2 font-body-2 text-secondary">Periksa akses atau coba muat ulang data proyek.</p>
      <AtomicButton class="mt-5" variant="outline" @click="retryLoad">Coba lagi</AtomicButton>
    </div>
  </main>
</template>

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
