<script setup lang="ts">
import {
  ArrowDownUp,
  ChevronDown,
  Funnel,
  SlidersHorizontal
} from '@lucide/vue'
import { useInfiniteScroll } from '~/composables/useInfiniteScroll'
import type { Application, Project } from '~/types/project'
import ApplicantDetailModal from '~/components/project/ApplicantDetailModal.vue'

definePageMeta({ layout: 'home' })
const route = useRoute()
const projectSlug = route.params.slug as string
const { show: showPopup } = usePopup()

const demoProjectId = 'demo-project-portfolio'
const frontendRole = {
  id: 'demo-role-frontend',
  contribution_role_id: 'role-frontend',
  contribution_role: {
    id: 'role-frontend',
    name: 'Frontend Developer',
    slug: 'frontend-developer',
    category: 'contribution_role'
  },
  custom_title: null,
  description: 'Membangun antarmuka yang cepat dan mudah digunakan.',
  capacity: 2,
  filled_capacity: 1,
  remaining_capacity: 1,
  status: 'open' as const,
  tools: [
    { id: 'tool-vue', name: 'Vue.js', slug: 'vue-js', category: 'tool' },
    { id: 'tool-nuxt', name: 'Nuxt', slug: 'nuxt', category: 'tool' }
  ],
  skill_tags: ['TypeScript', 'Responsive UI']
}
const designRole = {
  id: 'demo-role-design',
  contribution_role_id: 'role-design',
  contribution_role: {
    id: 'role-design',
    name: 'UI/UX Designer',
    slug: 'ui-ux-designer',
    category: 'contribution_role'
  },
  custom_title: null,
  description: 'Merancang pengalaman pengguna dan sistem visual produk.',
  capacity: 2,
  filled_capacity: 0,
  remaining_capacity: 2,
  status: 'open' as const,
  tools: [{ id: 'tool-figma', name: 'Figma', slug: 'figma', category: 'tool' }],
  skill_tags: ['UI/UX', 'Prototyping']
}
const backendRole = {
  id: 'demo-role-backend',
  contribution_role_id: 'role-backend',
  contribution_role: {
    id: 'role-backend',
    name: 'Backend Developer',
    slug: 'backend-developer',
    category: 'contribution_role'
  },
  custom_title: null,
  description: 'Mengembangkan API dan pengelolaan data proyek.',
  capacity: 1,
  filled_capacity: 0,
  remaining_capacity: 1,
  status: 'open' as const,
  tools: [{ id: 'tool-go', name: 'Go', slug: 'go', category: 'tool' }],
  skill_tags: ['REST API', 'PostgreSQL']
}

const DEMO_PROJECT: Project = {
  id: demoProjectId,
  creator_id: 'demo-project-owner',
  title: 'Platform Portofolio untuk Talenta Digital',
  slug: 'platform-portofolio-talenta-digital',
  summary: 'Ruang untuk talenta digital menyusun dan membagikan karya.',
  description: null,
  project_category: 'product',
  visibility: 'public',
  status: 'open',
  max_slots: 5,
  availability: 'part_time',
  start_date: null,
  deadline: null,
  why_join: null,
  created_at: '2026-10-01T08:00:00.000Z',
  published_at: '2026-10-02T08:00:00.000Z',
  creation_mode: 'personal',
  project_roles: [frontendRole, designRole, backendRole]
}

const createDemoApplication = (application: {
  id: string
  name: string
  username: string
  headline: string
  role: typeof frontendRole | typeof designRole | typeof backendRole
  status: Application['status']
  appliedAt: string
  availability: Application['availability']
  motivation: string
  contribution: string
  portfolio?: string[]
  reviewerNote?: string | null
}): Application => ({
  id: application.id,
  project_id: demoProjectId,
  applicant_id: `demo-user-${application.username}`,
  motivation: application.motivation,
  expected_contribution: application.contribution,
  portfolio_links: application.portfolio || [],
  availability: application.availability,
  status: application.status,
  reviewer_note: application.reviewerNote || null,
  applied_at: application.appliedAt,
  project_role_id: application.role.id,
  project_role: application.role,
  estimated_hours_per_week: 20,
  reviewed_by: application.status === 'pending' ? null : 'demo-project-owner',
  reviewed_at: application.status === 'pending' ? null : application.appliedAt,
  profiles: {
    username: application.username,
    full_name: application.name,
    avatar: null,
    headline: application.headline,
    completion_score: 85
  },
  projects: {
    id: demoProjectId,
    title: DEMO_PROJECT.title,
    slug: DEMO_PROJECT.slug,
    status: DEMO_PROJECT.status
  }
})

const DEMO_APPLICATIONS: Application[] = [
  createDemoApplication({
    id: 'demo-application-rizky',
    name: 'Rizky Pratama',
    username: 'rizkypratama',
    headline: 'Frontend Developer · Vue & Nuxt',
    role: frontendRole,
    status: 'pending',
    appliedAt: '2026-10-09T08:30:00.000Z',
    availability: 'part_time',
    motivation:
      'Saya tertarik membangun produk yang membantu talenta membuktikan kemampuan melalui pengalaman nyata. Saya ingin belajar sambil memberikan kontribusi yang dapat digunakan.',
    contribution:
      'Membangun reusable component, integrasi API, dan responsive layout.',
    portfolio: ['https://github.com/example/frontend']
  }),
  createDemoApplication({
    id: 'demo-application-nadia',
    name: 'Nadia Putri',
    username: 'nadiaputri',
    headline: 'Product Designer · Figma & Research',
    role: designRole,
    status: 'pending',
    appliedAt: '2026-10-08T07:45:00.000Z',
    availability: 'flexible',
    motivation:
      'Saya ingin membantu membuat pengalaman produk terasa lebih jelas dan ramah untuk talenta digital.',
    contribution: 'Riset pengguna, alur onboarding, dan prototipe interaktif.',
    portfolio: ['https://behance.net/example/nadia']
  }),
  createDemoApplication({
    id: 'demo-application-dimas',
    name: 'Dimas Saputra',
    username: 'dimassaputra',
    headline: 'Backend Developer · Go & PostgreSQL',
    role: backendRole,
    status: 'pending',
    appliedAt: '2026-10-07T10:10:00.000Z',
    availability: 'part_time',
    motivation:
      'Saya tertarik ikut merancang fondasi layanan yang aman dan mudah dikembangkan.',
    contribution: 'Membuat endpoint, validasi data, dan dokumentasi API.'
  }),
  createDemoApplication({
    id: 'demo-application-sarah',
    name: 'Sarah Amelia',
    username: 'sarahamelia',
    headline: 'UI/UX Designer · Design System',
    role: designRole,
    status: 'pending',
    appliedAt: '2026-10-06T06:15:00.000Z',
    availability: 'weekends_only',
    motivation:
      'Saya ingin mengembangkan pengalaman kolaboratif bersama tim lintas disiplin.',
    contribution: 'Menyusun komponen desain dan panduan antarmuka.'
  }),
  createDemoApplication({
    id: 'demo-application-budi',
    name: 'Budi Santoso',
    username: 'budisantoso',
    headline: 'Full Stack Developer · Vue & Go',
    role: frontendRole,
    status: 'pending',
    appliedAt: '2026-10-05T09:00:00.000Z',
    availability: 'full_time',
    motivation:
      'Saya ingin membantu mewujudkan platform portofolio yang berguna bagi komunitas.',
    contribution:
      'Membangun halaman produk dan menghubungkannya dengan layanan backend.'
  }),
  createDemoApplication({
    id: 'demo-application-fajar',
    name: 'Fajar Ramadhan',
    username: 'fajarramadhan',
    headline: 'Frontend Developer · TypeScript',
    role: frontendRole,
    status: 'accepted',
    appliedAt: '2026-10-04T08:20:00.000Z',
    availability: 'part_time',
    motivation:
      'Saya ingin berkontribusi pada produk yang mendukung perjalanan karier talenta.',
    contribution: 'Merapikan komponen dan membantu menjaga kualitas antarmuka.',
    reviewerNote: 'Selamat bergabung dengan tim!'
  }),
  createDemoApplication({
    id: 'demo-application-intan',
    name: 'Intan Permata',
    username: 'intanpermata',
    headline: 'Product Designer · UI/UX',
    role: designRole,
    status: 'rejected',
    appliedAt: '2026-10-03T05:35:00.000Z',
    availability: 'flexible',
    motivation: 'Saya tertarik berkolaborasi dan belajar bersama tim produk.',
    contribution: 'Membantu merancang halaman portofolio yang mudah digunakan.',
    reviewerNote:
      'Terima kasih sudah mengajukan diri. Saat ini posisi sudah terisi.'
  })
]

// Fixture lokal agar halaman ini dapat dipreview tanpa memanggil API.
const project = ref<Project>(structuredClone(DEMO_PROJECT))
const applications = ref<Application[]>(structuredClone(DEMO_APPLICATIONS))

useHead(() => ({
  title: project.value ? `Pelamar: ${project.value.title}` : 'Kelola Pelamar'
}))

const searchQuery = ref('')
const selectedStatuses = ref<Application['status'][]>([])
const selectedRoles = ref<string[]>([])
const sortOrder = ref<'newest' | 'oldest'>('newest')
const isMobileFilterOpen = ref(false)
const isMobileSortOpen = ref(false)
const isMobileStatusFilterOpen = ref(false)
const isMobileRoleFilterOpen = ref(false)
const isModalOpen = ref(false)
const selectedApplicant = ref<Application | null>(null)
const isSubmitting = ref(false)
const isDesktop = ref(false)
const currentPage = ref(1)
const mobileDisplayCount = ref(5)
const pageSize = 5
const mobileStep = 5
let mediaQuery: MediaQueryList | null = null

const filters = [
  { label: 'Menunggu', value: 'pending' },
  { label: 'Diterima', value: 'accepted' },
  { label: 'Ditolak', value: 'rejected' },
  { label: 'Dibatalkan', value: 'withdrawn' }
] as const

const getName = (application: Application) =>
  application.profiles?.full_name ||
  application.profiles?.username ||
  'Talent Kolaboria'

const getRoleName = (application: Application) =>
  application.project_role?.custom_title ||
  application.project_role?.contribution_role?.name ||
  'Kontributor'

const stats = computed(() => {
  const all = applications.value || []
  return {
    total: all.length,
    pending: all.filter((application) => application.status === 'pending')
      .length,
    accepted: all.filter((application) => application.status === 'accepted')
      .length,
    rejected: all.filter((application) => application.status === 'rejected')
      .length,
    withdrawn: all.filter((application) => application.status === 'withdrawn')
      .length
  }
})

const totalCapacity = computed(() => {
  const roles = project.value?.project_roles || []
  return roles.length
    ? roles.reduce((sum, role) => sum + role.capacity, 0)
    : project.value?.max_slots || 0
})
const filledCapacity = computed(() => {
  const roles = project.value?.project_roles || []
  return roles.length
    ? roles.reduce((sum, role) => sum + role.filled_capacity, 0)
    : 0
})
const capacityProgress = computed(() =>
  totalCapacity.value
    ? Math.min(100, (filledCapacity.value / totalCapacity.value) * 100)
    : 0
)
const roleOptions = computed(() => {
  const seen = new Set<string>()
  return (project.value?.project_roles || []).flatMap((role) => {
    const title = role.custom_title || role.contribution_role?.name
    if (!title || seen.has(role.id)) return []
    seen.add(role.id)
    return [{ value: role.id, label: title }]
  })
})
const sortOptions = [
  { label: 'Terbaru', value: 'newest' },
  { label: 'Terlama', value: 'oldest' }
]

const isAllStatusesSelected = computed(
  () => selectedStatuses.value.length === 0
)
const isAllRolesSelected = computed(() => selectedRoles.value.length === 0)
const activeFilterCount = computed(
  () => selectedStatuses.value.length + selectedRoles.value.length
)

const toggleAllStatuses = (checked: boolean) => {
  if (checked) selectedStatuses.value = []
}
const toggleStatus = (status: Application['status']) => {
  selectedStatuses.value = selectedStatuses.value.includes(status)
    ? selectedStatuses.value.filter((item) => item !== status)
    : [...selectedStatuses.value, status]
}
const toggleAllRoles = (checked: boolean) => {
  if (checked) selectedRoles.value = []
}
const toggleRole = (roleId: string) => {
  selectedRoles.value = selectedRoles.value.includes(roleId)
    ? selectedRoles.value.filter((item) => item !== roleId)
    : [...selectedRoles.value, roleId]
}
const resetFilters = () => {
  selectedStatuses.value = []
  selectedRoles.value = []
  searchQuery.value = ''
  sortOrder.value = 'newest'
  resetListPosition()
}
const statusFilterLabel = computed(() => {
  if (selectedStatuses.value.length === 0) return 'Status'
  if (selectedStatuses.value.length > 1)
    return `${selectedStatuses.value.length} Status`
  const selected = filters.find(
    (filter) => filter.value === selectedStatuses.value[0]
  )
  return selected?.label || 'Status'
})
const roleFilterLabel = computed(() => {
  if (selectedRoles.value.length === 0) return 'Posisi'
  if (selectedRoles.value.length > 1)
    return `${selectedRoles.value.length} Posisi`
  return (
    roleOptions.value.find((role) => role.value === selectedRoles.value[0])
      ?.label || 'Posisi'
  )
})

const filteredApplications = computed(() => {
  let result = [...(applications.value || [])]
  if (selectedStatuses.value.length > 0) {
    result = result.filter((application) =>
      selectedStatuses.value.includes(application.status)
    )
  }
  if (selectedRoles.value.length > 0) {
    result = result.filter((application) =>
      selectedRoles.value.includes(application.project_role_id)
    )
  }
  const query = searchQuery.value.trim().toLocaleLowerCase('id-ID')
  if (query) {
    result = result.filter((application) => {
      const searchable = [
        getName(application),
        application.profiles?.username,
        application.profiles?.headline,
        getRoleName(application),
        application.motivation,
        application.expected_contribution,
        ...(application.project_role?.tools || []).map((tool) => tool.name),
        ...(application.project_role?.skill_tags || [])
      ]
      return searchable.some((value) =>
        value?.toLocaleLowerCase('id-ID').includes(query)
      )
    })
  }
  result.sort((a, b) => {
    const difference =
      new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime()
    return sortOrder.value === 'newest' ? -difference : difference
  })
  return result
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredApplications.value.length / pageSize))
)
const hasMoreMobile = computed(
  () => mobileDisplayCount.value < filteredApplications.value.length
)
const displayedApplications = computed(() => {
  if (isDesktop.value) {
    const start = (currentPage.value - 1) * pageSize
    return filteredApplications.value.slice(start, start + pageSize)
  }
  return filteredApplications.value.slice(0, mobileDisplayCount.value)
})
const displayedCount = computed(() => displayedApplications.value.length)

const { sentinelRef, isLoading: loadingMore } = useInfiniteScroll({
  onLoadMore: () => {
    mobileDisplayCount.value += mobileStep
  },
  hasMore: hasMoreMobile,
  disabled: isDesktop,
  distance: '180px'
})

const resetListPosition = () => {
  currentPage.value = 1
  mobileDisplayCount.value = mobileStep
}
watch(
  [selectedStatuses, selectedRoles, searchQuery, sortOrder],
  resetListPosition,
  { deep: true }
)
watch(filteredApplications, () => {
  currentPage.value = Math.min(currentPage.value, totalPages.value)
})

const handleMediaChange = (event: MediaQueryListEvent | MediaQueryList) => {
  isDesktop.value = event.matches
  resetListPosition()
}
onMounted(() => {
  mediaQuery = window.matchMedia('(min-width: 768px)')
  isDesktop.value = mediaQuery.matches
  mediaQuery.addEventListener('change', handleMediaChange)
})
onUnmounted(() => mediaQuery?.removeEventListener('change', handleMediaChange))

const openModal = (application: Application) => {
  selectedApplicant.value = application
  isModalOpen.value = true
}
const handleReviewed = async (
  status: 'accepted' | 'rejected',
  note: string
) => {
  if (!selectedApplicant.value) return
  isSubmitting.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const application = applications.value.find(
      (item) => item.id === selectedApplicant.value?.id
    )
    if (!application || application.status !== 'pending') return

    if (status === 'accepted') {
      const role = project.value.project_roles?.find(
        (item) => item.id === application.project_role_id
      )
      if (!role || role.remaining_capacity <= 0) {
        showPopup({
          title: 'Slot posisi sudah penuh',
          description:
            'Pilih pengajuan untuk posisi yang masih memiliki slot tersedia.',
          type: 'warning',
          positiveLabel: 'Mengerti'
        })
        return
      }
      role.filled_capacity += 1
      role.remaining_capacity -= 1
      if (role.remaining_capacity === 0) role.status = 'filled'
      applications.value
        .filter((item) => item.project_role_id === role.id && item.project_role)
        .forEach((item) => {
          item.project_role = structuredClone(role)
        })
    }

    application.status = status
    application.reviewer_note = note || null
    application.reviewed_at = new Date().toISOString()
    isModalOpen.value = false
    selectedApplicant.value = null
  } finally {
    isSubmitting.value = false
  }
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  pending: {
    label: 'Menunggu',
    classes: 'bg-accent-50 text-accent-800 ring-accent-200'
  },
  accepted: {
    label: 'Diterima',
    classes: 'bg-success-50 text-success-700 ring-success-200'
  },
  rejected: {
    label: 'Ditolak',
    classes: 'bg-danger-50 text-danger-700 ring-danger-200'
  },
  withdrawn: {
    label: 'Dibatalkan',
    classes: 'bg-neutral-100 text-neutral-600 ring-neutral-200'
  }
}

const availabilityLabels: Record<string, string> = {
  flexible: 'Fleksibel',
  full_time: 'Penuh waktu',
  part_time: 'Paruh waktu',
  weekends_only: 'Hanya akhir pekan'
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
const projectStatusLabel = computed(
  () =>
    ({
      open: 'Menerima Kontributor',
      awaiting_owner: 'Menunggu Project Lead',
      in_progress: 'Sedang berjalan',
      completed: 'Selesai',
      archived: 'Diarsipkan',
      draft: 'Draf'
    })[project.value?.status || 'draft']
)
</script>

<template>
  <main class="min-h-screen bg-neutral-50 pb-10 pt-5 sm:pt-8">
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
          <span
            class="rounded-full bg-accent-50 px-3 py-1.5 font-label-3 text-accent-900"
            >Simulasi konsep produk</span
          >
          <AtomicButton
            :to="`/projects/${projectSlug}`"
            variant="outline"
            size="sm"
            class="self-start sm:self-auto"
          >
            <template #icon-left
              ><Icon
                name="lucide:arrow-left"
                class="h-4 w-4"
                aria-hidden="true"
            /></template>
            Kembali ke Proyek
          </AtomicButton>
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
                <strong>{{ filteredApplications.length }}</strong> pengajuan
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
                {{ filteredApplications.length }} pengajuan
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
                v-model="searchQuery"
                placeholder="Cari nama, skill, atau kontribusi..."
                :debounce-ms="200"
                aria-label="Cari nama, skill, atau kontribusi"
              />
            </div>

            <div v-if="displayedApplications.length" class="space-y-3">
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
                        aria-label="Skill dan tools pelamar"
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
                :total-items="filteredApplications.length"
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
    />
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
