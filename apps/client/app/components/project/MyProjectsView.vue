<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { Plus, SquareMenu, Clock, FilePen } from '@lucide/vue'
import type { MyProjectSummaryResponse } from '~/types/project-editor'
import { useProjects } from '~/composables/useProjects'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import { useInfiniteScroll } from '~/composables/useInfiniteScroll'
import { useMyProjectList } from '~/composables/useMyProjectList'
import { getMyProjectSummaryStats } from '~/utils/my-project-summary-stats'
import { getApiErrorMessage } from '~/utils/error'
import MyProjectCard from '~/components/project/MyProjectCard.vue'
import ProjectStatusConfirmModal from '~/components/project/ProjectStatusConfirmModal.vue'
import { useProjectLifecycle } from '~/composables/useProjectLifecycle'
import type { ProjectLifecycleAction } from '~/types/project-editor'

const { currentUserId } = useAuth()
const toast = useToast()
const searchQuery = ref('')
const activeSearch = ref('')
const projectSearch = computed(() => ({ search: activeSearch.value || undefined }))

// ─── PROGRESSIVE DATA LOADING (useMyProjectList) ───
const { projects, pending, loadingMore, loadMoreError, error, refresh } =
  useMyProjectList(currentUserId, projectSearch)

const loadError = computed(() =>
  error.value
    ? getApiErrorMessage(error.value, 'Daftar proyek belum dapat dimuat.')
    : ''
)

// Display complete totals only after every API page has loaded successfully.
const projectStatsReady = computed(() =>
  !pending.value && !loadingMore.value && !error.value && !loadMoreError.value
)
const projectSummaryStats = computed(() => getMyProjectSummaryStats(projects.value))
const activeProjectsCount = computed(() =>
  projectStatsReady.value ? projectSummaryStats.value.activeProjects : null
)
const draftProjectsCount = computed(() =>
  projectStatsReady.value ? projectSummaryStats.value.draftProjects : null
)
const totalPendingApplicants = computed(() =>
  projectStatsReady.value ? projectSummaryStats.value.pendingApplicants : null
)
const pendingApplicantsDescription = computed(() => {
  if (pending.value || loadingMore.value) return 'Memuat ringkasan proyek'
  if (error.value || loadMoreError.value) return 'Ringkasan belum lengkap'
  if (totalPendingApplicants.value === null) return 'Jumlah belum tersedia dari API'
  return 'Membutuhkan keputusan'
})

// ─── FILTER STATES (Dropdown like sort) ───
type StatusFilter =
  | 'all'
  | 'draft'
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'archived'

const selectedStatus = ref<StatusFilter>('all')
const activeTab = selectedStatus // aliased for backward compatibility

const statusOptions = computed(() => [
  { label: `Semua status (${projects.value.length})`, value: 'all' },
  {
    label: `Draft (${projects.value.filter((p) => p.status === 'draft').length})`,
    value: 'draft'
  },
  {
    label: `Menerima Kontributor (${projects.value.filter((p) => p.status === 'open').length})`,
    value: 'open'
  },
  {
    label: `Berjalan (${projects.value.filter((p) => p.status === 'in_progress').length})`,
    value: 'in_progress'
  },
  {
    label: `Selesai (${projects.value.filter((p) => p.status === 'completed').length})`,
    value: 'completed'
  },
  {
    label: `Arsip (${projects.value.filter((p) => p.status === 'archived').length})`,
    value: 'archived'
  }
])

const tabs = computed(() => [
  {
    label: 'Semua',
    value: 'all' as StatusFilter,
    count: projects.value.length
  },
  {
    label: 'Draft',
    value: 'draft' as StatusFilter,
    count: projects.value.filter((p) => p.status === 'draft').length
  },
  {
    label: 'Menerima Kontributor',
    value: 'open' as StatusFilter,
    count: projects.value.filter((p) => p.status === 'open').length
  },
  {
    label: 'Berjalan',
    value: 'in_progress' as StatusFilter,
    count: projects.value.filter((p) => p.status === 'in_progress').length
  },
  {
    label: 'Selesai',
    value: 'completed' as StatusFilter,
    count: projects.value.filter((p) => p.status === 'completed').length
  },
  {
    label: 'Arsip',
    value: 'archived' as StatusFilter,
    count: projects.value.filter((p) => p.status === 'archived').length
  }
])

// ─── SEARCH & DROPDOWN FILTERS ───
const selectedContext = ref('all')
const sortBy = ref('newest')

const isFilterActive = computed(() => {
  return Boolean(
    searchQuery.value.trim() ||
    activeSearch.value.trim() ||
    selectedStatus.value !== 'all' ||
    selectedContext.value !== 'all'
  )
})

const resetFilters = () => {
  searchQuery.value = ''
  activeSearch.value = ''
  selectedStatus.value = 'all'
  selectedContext.value = 'all'
  sortBy.value = 'newest'
}

const contextOptions = [
  { label: 'Semua konteks', value: 'all' },
  { label: 'Proyek client', value: 'client' },
  { label: 'Eksperimen', value: 'experiment' },
  { label: 'Komunitas', value: 'community' },
  { label: 'Proyek pribadi', value: 'personal' }
]

const sortOptions = [
  { label: 'Terbaru', value: 'newest' },
  { label: 'Terlama', value: 'oldest' },
  { label: 'Kapasitas', value: 'capacity' }
]

// ─── FILTERED & SORTED PROJECTS ───
const filteredProjects = computed(() => {
  let list = projects.value

  // Status Filter
  if (selectedStatus.value !== 'all') {
    list = list.filter((p) => p.status === selectedStatus.value)
  }

  // Context Filter
  if (selectedContext.value !== 'all') {
    list = list.filter((p) => p.origin === selectedContext.value)
  }

  // Sorting
  return list.slice().sort((a, b) => {
    if (sortBy.value === 'newest') {
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      )
    }
    if (sortBy.value === 'oldest') {
      return (
        new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime()
      )
    }
    if (sortBy.value === 'capacity') {
      return (b.filled_capacity || 0) - (a.filled_capacity || 0)
    }
    return 0
  })
})

// ─── RESPONSIVE VIEWPORT DETECTION ───
const isDesktop = ref(false)
let mediaQuery: MediaQueryList | null = null

const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
  isDesktop.value = e.matches
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(min-width: 1024px)')
    isDesktop.value = mediaQuery.matches
    mediaQuery.addEventListener('change', handleMediaChange)
  }
})

onUnmounted(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleMediaChange)
  }
})

// ─── DESKTOP PAGINATION ───
const currentPage = ref(1)
const desktopItemsPerPage = 6

const totalPages = computed(() => {
  return Math.ceil(filteredProjects.value.length / desktopItemsPerPage) || 1
})

// ─── MOBILE ENDLESS SCROLL ───
const mobileDisplayCount = ref(4)
const mobileStep = 4

const hasMoreMobile = computed(() => {
  return mobileDisplayCount.value < filteredProjects.value.length
})

const loadMoreMobile = async () => {
  mobileDisplayCount.value += mobileStep
}

const { sentinelRef } = useInfiniteScroll({
  onLoadMore: loadMoreMobile,
  hasMore: hasMoreMobile,
  disabled: isDesktop,
  distance: '200px'
})

// Reset pagination/count when filters change
watch([selectedStatus, selectedContext, searchQuery, sortBy], () => {
  currentPage.value = 1
  mobileDisplayCount.value = mobileStep
})

// ─── DISPLAYED PROJECTS SLICE ───
const displayedProjects = computed(() => {
  if (isDesktop.value) {
    const start = (currentPage.value - 1) * desktopItemsPerPage
    return filteredProjects.value.slice(start, start + desktopItemsPerPage)
  }
  return filteredProjects.value.slice(0, mobileDisplayCount.value)
})

const isEmptyState = computed(() => {
  return !pending.value && !loadError.value && filteredProjects.value.length === 0
})

const currentDisplayedCount = computed(() => {
  if (filteredProjects.value.length === 0) return 0
  if (isDesktop.value) {
    return Math.min(
      currentPage.value * desktopItemsPerPage,
      filteredProjects.value.length
    )
  }
  return Math.min(mobileDisplayCount.value, filteredProjects.value.length)
})

const lifecycle = useProjectLifecycle({
  accountId: currentUserId,
  onChanged: async (action) => {
    toast.success(
      action === 'delete'
        ? 'Draft proyek berhasil dihapus.'
        : action === 'draft'
          ? 'Proyek berhasil dikembalikan ke draft.'
          : action === 'in_progress'
            ? 'Proyek berhasil dimulai.'
            : 'Proyek berhasil diarsipkan.'
    )
    await refresh()
    currentPage.value = Math.min(currentPage.value, totalPages.value)
  },
  onConflict: refresh
})
const handleLifecycleRequest = (action: ProjectLifecycleAction, id: string) => {
  const target = projects.value.find((p) => p.id === id)
  if (target) lifecycle.request(action, target)
}
</script>

<template>
  <div class="mx-auto w-full pb-16">
    <!-- ─── PAGE HEADER ─── -->
    <header class="flex flex-col gap-1 sm:gap-2">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p
            class="font-label-3 text-xs font-bold uppercase tracking-wider text-primary-600"
          >
            RUANG KELOLA
          </p>
          <h1
            class="mt-1 font-title-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl"
          >
            Proyek Saya
          </h1>
        </div>

        <NuxtLink v-if="!isEmptyState" to="/projects/create">
          <AtomicButton variant="primary" size="sm">
            <template #icon-left>
              <Plus class="h-4 w-4" />
            </template>
            Buat Proyek
          </AtomicButton>
        </NuxtLink>
      </div>

      <p class="font-body-2 text-sm text-neutral-500 sm:text-base">
        Kelola proyek yang kamu bangun dan kembangkan bersama kontributor.
      </p>
    </header>

    <!-- ─── SUMMARY STATS (3 Columns OrganismCard) ─── -->
    <section aria-label="Statistik Proyek Saya" class="mt-6">
      <OrganismCard variant="default" padding="none">
        <div class="grid grid-cols-3 divide-x divide-neutral-200 p-4 md:p-6">
          <!-- Card 1: Proyek Aktif -->
          <div class="flex items-center justify-between pr-3 md:pr-6">
            <div>
              <p class="font-label-3 text-xs text-neutral-500 md:text-sm">
                Proyek Aktif
              </p>
              <p
                class="mt-1 font-title-1 text-2xl font-bold text-neutral-900 md:text-3xl"
              >
                {{ activeProjectsCount ?? '—' }}
              </p>
              <p
                class="mt-1 hidden font-body-3 text-xs text-neutral-400 md:block"
              >
                Menerima kontributor & berjalan
              </p>
            </div>
            <div
              class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 md:flex"
              aria-hidden="true"
            >
              <SquareMenu class="h-5 w-5 text-primary-600" />
            </div>
          </div>

          <!-- Card 2: Pengajuan Menunggu -->
          <div class="flex items-center justify-between px-3 md:px-6">
            <div>
              <p class="font-label-3 text-xs text-neutral-500 md:text-sm">
                Pengajuan Menunggu
              </p>
              <p
                class="mt-1 font-title-1 text-2xl font-bold text-amber-600 md:text-3xl"
              >
                {{ totalPendingApplicants ?? '—' }}
              </p>
              <p
                class="mt-1 hidden font-body-3 text-xs text-neutral-400 md:block"
              >
                {{ pendingApplicantsDescription }}
              </p>
            </div>
            <div
              class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 md:flex"
              aria-hidden="true"
            >
              <Clock class="h-5 w-5 text-amber-600" />
            </div>
          </div>

          <!-- Card 3: Draft Proyek -->
          <div class="flex items-center justify-between pl-3 md:pl-6">
            <div>
              <p class="font-label-3 text-xs text-neutral-500 md:text-sm">
                Draft Proyek
              </p>
              <p
                class="mt-1 font-title-1 text-2xl font-bold text-neutral-900 md:text-3xl"
              >
                {{ draftProjectsCount ?? '—' }}
              </p>
              <p
                class="mt-1 hidden font-body-3 text-xs text-neutral-400 md:block"
              >
                Belum dipublikasikan
              </p>
            </div>
            <div
              class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 md:flex"
              aria-hidden="true"
            >
              <FilePen class="h-5 w-5 text-sky-600" />
            </div>
          </div>
        </div>
      </OrganismCard>
    </section>

    <!-- ─── DAFTAR PROYEK SECTION ─── -->
    <section class="mt-10" aria-labelledby="project-list-heading">
      <div class="mb-4">
        <h2
          id="project-list-heading"
          class="font-title-2 text-xl font-bold text-neutral-900"
        >
          Daftar Proyek
        </h2>
        <p class="mt-0.5 font-body-2 text-sm text-neutral-500">
          Pantau kebutuhan tim dan perkembangan setiap proyek.
        </p>
      </div>

      <!-- ─── SEARCH & FILTER CONTROLS (Design System Molecules) ─── -->
      <div class="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <!-- Search Input (MoleculeSearchField) -->
        <div class="relative flex-1">
          <MoleculeSearchField
            v-model="searchQuery"
            @search="activeSearch = $event"
            placeholder="Cari nama atau deskripsi proyek (minimal 3 karakter)..."
          />
        </div>

        <!-- Filter Dropdowns Row (MoleculeDropdown) -->
        <div
          class="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:flex lg:items-center"
        >
          <!-- Status Dropdown (Approach like sort dropdown) -->
          <div class="w-full lg:w-56">
            <MoleculeDropdown
              v-model="selectedStatus"
              :options="statusOptions"
              placeholder="Semua status"
            />
          </div>

          <!-- Context Dropdown -->
          <div class="w-full lg:w-48">
            <MoleculeDropdown
              v-model="selectedContext"
              :options="contextOptions"
              placeholder="Semua konteks"
            />
          </div>

          <!-- Sort Dropdown -->
          <div class="w-full lg:w-40">
            <MoleculeDropdown
              v-model="sortBy"
              :options="sortOptions"
              placeholder="Terbaru"
            />
          </div>
        </div>
      </div>

      <!-- ─── RESULT COUNTER ─── -->
      <div class="mt-4 font-body-2 text-sm text-neutral-500">
        Menampilkan {{ currentDisplayedCount }} dari
        {{ filteredProjects.length }} proyek
      </div>

      <!-- ─── API CONTENT STATE ─── -->
      <OrganismAsyncContent :pending="pending" :ready="Boolean(projects.length)" label="Memuat proyek...">

      <!-- ─── ERROR STATE ─── -->
      <div
        v-if="loadError"
        class="mt-6 rounded-2xl border border-danger-200 bg-white p-6 text-danger-700"
        role="alert"
      >
        <p class="font-body-2">{{ loadError }}</p>
        <AtomicButton class="mt-4" variant="outline" @click="refresh">
          Coba lagi
        </AtomicButton>
      </div>

      <!-- ─── PROJECTS CONTENT ─── -->
      <template v-else>
        <!-- Projects Grid (1 col on mobile, 2 cols on desktop) -->
        <div
          v-if="displayedProjects.length > 0"
          class="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <MyProjectCard
            v-for="project in displayedProjects"
            :key="project.id"
            :project="project"
            :current-user-id="currentUserId || ''"
            :roles="project.roles"
            :pending-applicants-count="project.pending_application_count ?? undefined"
            @lifecycle="handleLifecycleRequest"
          />
        </div>

        <!-- Empty State (OrganismEmptyState) -->
        <OrganismCard v-else class="mt-6" padding="none">
          <OrganismEmptyState
            :title="isFilterActive ? 'Tidak ada proyek yang sesuai' : 'Belum ada proyek'"
            :description="
              isFilterActive
                ? 'Coba sesuaikan kata kunci pencarian atau filter yang dipilih.'
                : 'Kamu belum memiliki proyek. Mulai inisiasi ide dan kolaborasi pertamamu!'
            "
            :icon="isFilterActive ? 'search' : 'folder'"
          >
            <template #actions>
              <div class="flex flex-wrap items-center justify-center gap-3">
                <AtomicButton
                  v-if="isFilterActive"
                  variant="outline"
                  size="sm"
                  @click="resetFilters"
                >
                  Reset Filter
                </AtomicButton>
                <NuxtLink to="/projects/create">
                  <AtomicButton variant="primary" size="sm">
                    <template #icon-left>
                      <Plus class="h-4 w-4" />
                    </template>
                    Buat Proyek
                  </AtomicButton>
                </NuxtLink>
              </div>
            </template>
          </OrganismEmptyState>
        </OrganismCard>

        <!-- ─── DESKTOP PAGINATION (Align End, MoleculePagination) ─── -->
        <div v-if="isDesktop && totalPages > 1" class="mt-8 flex justify-end">
          <MoleculePagination
            v-model="currentPage"
            :total-pages="totalPages"
            :total-items="filteredProjects.length"
            :per-page="desktopItemsPerPage"
            align="end"
          />
        </div>

        <!-- ─── MOBILE ENDLESS SCROLL SENTINEL ─── -->
        <div
          v-if="!isDesktop && hasMoreMobile"
          ref="sentinelRef"
          class="flex justify-center py-8"
        >
          <span v-if="loadingMore" class="font-body-3 text-secondary" role="status">Memuat proyek lainnya...</span>
        </div>
      </template>
      </OrganismAsyncContent>
    </section>

    <!-- ─── ARCHIVE MODAL (ProjectStatusConfirmModal) ─── -->
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
  </div>
</template>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
