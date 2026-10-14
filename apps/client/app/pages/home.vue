<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Profile, UserSkill, UserTool } from '../types/profile'
import type { Project } from '../types/project'
import type { ApplicantStatsResponse } from '../types/application'
import { ApplicationService } from '../services/application.service'

definePageMeta({
  layout: 'home',
  middleware: ['auth', 'onboarding-guard']
})

useHead({
  title: 'Kolaboria — Beranda'
})

// =========================================================
// COMPOSABLES & USER DATA
// =========================================================

const { user } = useAuth()
const { getProfile, getChecklist } = useProfile()
const { getUserSkills, getUserTools } = useSkill()
const { getMyProjects } = useProjects()

const profile = ref<Profile | null>(null)
const skills = ref<UserSkill[]>([])
const tools = ref<UserTool[]>([])
const checklist = ref<ReturnType<typeof getChecklist>>([])
const myProjects = ref<Project[]>([])
const applicationStats = ref<ApplicantStatsResponse | null>(null)
const isLoading = ref(true)

// Fetch active user data while gracefully falling back to prototype dummy data
const fetchAllData = async () => {
  try {
    profile.value = await getProfile()

    if (profile.value) {
      const [userSkills, userTools, projects, applicationSummary] = await Promise.all([
        getUserSkills(profile.value.id).catch(() => []),
        getUserTools(profile.value.id).catch(() => []),
        getMyProjects().catch(() => []),
        ApplicationService.getMyApplicationSummary().catch(() => null)
      ])

      skills.value = userSkills
      tools.value = userTools
      myProjects.value = projects
      applicationStats.value = applicationSummary?.data?.stats ?? null
      checklist.value = getChecklist(profile.value, userSkills, userTools)
    }
  } catch (error) {
    console.warn('Dashboard data fetched with fallback dummy state:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAllData)

// =========================================================
// COMPUTED USER HEADERS & SKILL TAGS
// =========================================================

const firstName = computed(() => {
  const fullName = profile.value?.full_name || user.value?.name
  if (fullName) {
    return fullName.trim().split(' ')[0]
  }
  return 'Fahmi'
})

const personalSkillTags = computed(() => {
  if (skills.value && skills.value.length > 0) {
    const visible = skills.value.slice(0, 3).map((s) => s.skills.name)
    const remaining = skills.value.length - visible.length
    if (remaining > 0) {
      visible.push(`+${remaining} skill lainnya`)
    }
    return visible
  }
  return ['Vue.js', 'Nuxt', 'TypeScript', '+3 skill lainnya']
})

const profileScore = computed(() => {
  return profile.value?.completion_score ?? 70
})

// =========================================================
// ACTIVITY SUMMARIES
// =========================================================

const activityList = computed(() => [
  {
    label: 'Lamaran',
    value: applicationStats.value?.total ?? 0,
    description: 'Project yang sudah kamu lamar.',
    linkText: 'Lihat lamaran',
    to: '/projects/my-applications',
    icon: 'file'
  },
  {
    label: 'Menunggu review',
    value: applicationStats.value?.pending ?? 0,
    description: 'Lamaran sedang dipertimbangkan pemilik project.',
    linkText: 'Lihat status',
    to: '/projects/my-applications',
    icon: 'clock'
  },
  {
    label: 'Diterima',
    value: applicationStats.value?.accepted ?? 0,
    description: 'Kamu diterima untuk bergabung dalam project.',
    linkText: 'Lihat project',
    to: '/projects/my-applications',
    icon: 'check'
  },
  {
    label: 'Project aktif',
    value:
      myProjects.value.filter((p) => ['open', 'in_progress'].includes(p.status)).length || 1,
    description: 'Kolaborasi yang sedang kamu jalankan.',
    linkText: 'Lihat project',
    to: '/projects/my-projects',
    icon: 'briefcase'
  }
])

// =========================================================
// ACTIVE JOURNEY (CONTINUE)
// =========================================================

const activeProject = ref({
  title: 'Kolaboria Landing Page Redesign',
  role: 'Frontend Developer',
  collaboratorName: 'Fadil',
  activityDescription: 'memberikan komentar pada',
  activityTarget: 'Implement Hero Section',
  avatarInitials: 'FA',
  tasksWaiting: 2,
  workspaceSlug: 'kolaboria-landing-page-redesign'
})

// =========================================================
// RECOMMENDED PROJECTS & BOOKMARKS
// =========================================================

interface RecommendedProject {
  id: string
  category: string
  title: string
  description: string
  matchReason: string
  skills: string[]
  role: string
  duration: string
  slug: string
}

const recommendedProjects = ref<RecommendedProject[]>([
  {
    id: 'project-rec-1',
    category: 'Education · Web Application',
    title: 'EduConnect Platform',
    description:
      'Membantu mahasiswa menemukan mentor, komunitas, dan ruang belajar yang tepat.',
    matchReason: 'Cocok dengan 3 skill kamu',
    skills: ['Vue.js', 'Nuxt', 'TypeScript'],
    role: 'Frontend Developer',
    duration: '± 4 minggu',
    slug: 'educonnect-platform'
  },
  {
    id: 'project-rec-2',
    category: 'SaaS · Productivity',
    title: 'TeamFlow',
    description:
      'Platform produktivitas untuk membantu small team bekerja dan berkolaborasi.',
    matchReason: 'Membutuhkan skill yang kamu miliki',
    skills: ['Vue.js', 'REST API', 'Tailwind'],
    role: 'Frontend Developer',
    duration: '± 6 minggu',
    slug: 'teamflow'
  },
  {
    id: 'project-rec-3',
    category: 'Social Impact · Technology',
    title: 'GreenConnect',
    description:
      'Platform kolaborasi komunitas untuk menjalankan berbagai inisiatif lingkungan.',
    matchReason: 'Sesuai dengan minatmu',
    skills: ['Nuxt', 'UI Development'],
    role: 'Web Developer',
    duration: '± 5 minggu',
    slug: 'greenconnect'
  }
])

const bookmarkedIds = ref<Set<string>>(new Set())

const toggleBookmark = (id: string, event: Event) => {
  event.stopPropagation()
  if (bookmarkedIds.value.has(id)) {
    bookmarkedIds.value.delete(id)
  } else {
    bookmarkedIds.value.add(id)
  }
}

const isBookmarked = (id: string) => bookmarkedIds.value.has(id)

// =========================================================
// INTERESTS CATEGORIES
// =========================================================

const interests = [
  { name: 'Technology', icon: 'code' },
  { name: 'AI', icon: 'cpu' },
  { name: 'Education', icon: 'book' },
  { name: 'Creative', icon: 'palette' },
  { name: 'Business', icon: 'briefcase' },
  { name: 'Social Impact', icon: 'users' },
  { name: 'Sustainability', icon: 'leaf' }
]

const exploreCategory = (category: string) => {
  navigateTo(`/projects?category=${encodeURIComponent(category)}`)
}

// =========================================================
// OWNER PROJECTS / TEAM BUILDING
// =========================================================

interface OpenRole {
  id: string
  name: string
  applicantCount: number
}

interface OwnerProject {
  id: string
  name: string
  memberCount: number
  status: 'active' | 'preparing' | 'completed'
  openRoles: OpenRole[]
}

const ownedProjects = ref<OwnerProject[]>([
  {
    id: 'project-001',
    name: 'Kolaboria Landing Page Redesign',
    memberCount: 3,
    status: 'active',
    openRoles: [
      { id: 'role-001', name: 'Frontend Developer', applicantCount: 3 },
      { id: 'role-002', name: 'UI/UX Designer', applicantCount: 1 }
    ]
  },
  {
    id: 'project-002',
    name: 'EduConnect Platform',
    memberCount: 2,
    status: 'preparing',
    openRoles: [
      { id: 'role-003', name: 'Backend Developer', applicantCount: 0 }
    ]
  },
  {
    id: 'project-003',
    name: 'Community Event Platform',
    memberCount: 2,
    status: 'active',
    openRoles: [
      { id: 'role-004', name: 'Product Designer', applicantCount: 2 },
      { id: 'role-005', name: 'QA Engineer', applicantCount: 0 }
    ]
  },
  {
    id: 'project-004',
    name: 'GreenConnect',
    memberCount: 5,
    status: 'active',
    openRoles: []
  }
])

const HOMEPAGE_OWNER_PROJECT_LIMIT = 2

const getApplicantCount = (project: OwnerProject) => {
  return project.openRoles.reduce((total, role) => total + role.applicantCount, 0)
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: 'Sedang berjalan',
    preparing: 'Persiapan',
    completed: 'Selesai'
  }
  return labels[status] || status
}

const getProjectPriority = (project: OwnerProject) => {
  const applicantCount = getApplicantCount(project)
  if (applicantCount > 0) return 1
  return 2
}

const projectsNeedingMembers = computed(() => {
  return [...ownedProjects.value]
    .filter((project) => Array.isArray(project.openRoles) && project.openRoles.length > 0)
    .sort((projectA, projectB) => {
      const priorityDiff = getProjectPriority(projectA) - getProjectPriority(projectB)
      if (priorityDiff !== 0) return priorityDiff
      return getApplicantCount(projectB) - getApplicantCount(projectA)
    })
})

const displayedOwnerProjects = computed(() => {
  return projectsNeedingMembers.value.slice(0, HOMEPAGE_OWNER_PROJECT_LIMIT)
})

const remainingOwnerProjectsCount = computed(() => {
  return Math.max(0, projectsNeedingMembers.value.length - HOMEPAGE_OWNER_PROJECT_LIMIT)
})

// =========================================================
// SMOOTH SCROLL & NAVIGATION ACTIONS
// =========================================================

const scrollToRecommended = () => {
  const el = document.getElementById('recommendedProjects')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1320px] pb-16 space-y-10">
    <!-- =======================================================
     1. WELCOME SECTION
    ======================================================== -->
    <section
      class="relative overflow-hidden rounded-2xl border border-primary-200/70 bg-gradient-to-br from-white via-primary-50/40 to-primary-100/40 p-6 shadow-xs sm:p-8"
    >
      <!-- Decorative background blur -->
      <div
        class="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-200/30 blur-3xl"
      />

      <div
        class="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"
      >
        <div class="max-w-2xl">

          <h1 class="font-title-1 text-secondary-900 mb-2">
            Halo, {{ firstName }}
          </h1>

          <p class="font-paragraph-3 text-secondary leading-relaxed max-w-xl">
            Temukan project yang sesuai dengan skill dan minatmu, lalu mulai
            bangun pengalaman melalui kolaborasi nyata.
          </p>

          <div class="flex flex-wrap gap-2 mt-4">
            <AtomicTagCategory
              v-for="(tag, index) in personalSkillTags"
              :key="index"
              variant="default"
              class="bg-white/90! border border-neutral-200! text-secondary!"
            >
              {{ tag }}
            </AtomicTagCategory>
          </div>
        </div>

        <div class="w-full sm:w-auto shrink-0">
          <AtomicButton
            id="exploreProjectsButton"
            variant="primary"
            size="md"
            class="w-full sm:w-auto"
            @click="scrollToRecommended"
          >
            <span>Eksplor Project</span>
            <template #icon-right>
              <svg
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </template>
          </AtomicButton>
        </div>
      </div>
    </section>

    <!-- =======================================================
     2. ACTIVITY SECTION
    ======================================================== -->
    <section>
      <header class="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 class="font-title-2 text-secondary-900">Aktivitasku</h2>
          <p class="font-body-2 text-muted mt-0.5">
            Pantau perkembangan lamaran dan kolaborasi yang sedang kamu jalani.
          </p>
        </div>

        <NuxtLink
          to="/projects/my-applications"
          class="shrink-0 inline-flex items-center gap-1 font-label-2 text-primary-700 hover:text-primary-800 hover:underline transition-colors"
        >
          <span>Lihat semua</span>
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </header>

      <div
        class="grid grid-cols-2 md:grid-cols-4 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs"
      >
        <article
          v-for="(item, index) in activityList"
          :key="index"
          class="p-5 bg-white transition-colors duration-150 hover:bg-neutral-50/80 border-neutral-200 flex flex-col justify-between"
          :class="[
            index % 2 === 0 ? 'border-r' : 'md:border-r',
            index < 2 ? 'border-b md:border-b-0' : '',
            index === 3 ? 'md:border-r-0' : ''
          ]"
        >
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="font-label-3 text-muted tracking-wider uppercase">
              {{ item.label }}
            </span>

            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600"
            >
              <!-- File Icon -->
              <svg
                v-if="item.icon === 'file'"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>

              <!-- Clock Icon -->
              <svg
                v-else-if="item.icon === 'clock'"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

              <!-- Check Icon -->
              <svg
                v-else-if="item.icon === 'check'"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.2"
                  d="M5 13l4 4L19 7"
                />
              </svg>

              <!-- Briefcase Icon -->
              <svg
                v-else
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </span>
          </div>

          <div
            class="font-title-1 font-bold tracking-tight text-secondary-900 mb-1"
          >
            {{ item.value }}
          </div>

          <p class="font-body-3 text-secondary min-h-[32px] leading-relaxed">
            {{ item.description }}
          </p>

          <NuxtLink
            :to="item.to"
            class="mt-3 inline-flex items-center gap-1 font-label-2 text-primary-700 hover:text-primary-800 hover:underline transition-colors"
          >
            <span>{{ item.linkText }}</span>
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </article>
      </div>
    </section>

    <!-- =======================================================
     3. CONTINUE SECTION (ACTIVE PROJECT & PROFILE COMPLETION)
    ======================================================== -->
    <section>
      <header class="mb-4">
        <h2 class="font-title-2 text-secondary-900">Lanjutkan yang sedang kamu kerjakan</h2>
        <p class="font-body-2 text-muted mt-0.5">
          Kembali ke aktivitas yang membutuhkan perhatianmu.
        </p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <!-- ACTIVE PROJECT CARD -->
        <OrganismCard padding="md" variant="default" class="h-full flex flex-col justify-between">
          <div>
            <div class="inline-flex items-center gap-2 font-label-3 text-primary-700 uppercase tracking-wider mb-2.5 font-bold">
              <span class="h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
              Project aktif
            </div>

            <h3 class="font-title-3 text-secondary-900">
              {{ activeProject.title }}
            </h3>

            <p class="font-body-2 text-secondary mt-1">
              Kamu berkontribusi sebagai
              <strong class="text-secondary-900 font-semibold">{{ activeProject.role }}</strong>
            </p>

            <div class="mt-4 flex items-center gap-3 rounded-lg bg-neutral-50 p-3 border border-neutral-100">
              <AtomicAvatar :name="activeProject.collaboratorName" size="sm" />
              <div class="font-body-3 text-secondary">
                <strong class="text-secondary-900">{{ activeProject.collaboratorName }}</strong>
                {{ activeProject.activityDescription }}
                <strong class="text-secondary-900">{{ activeProject.activityTarget }}</strong>
              </div>
            </div>
          </div>

          <div class="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-neutral-100">
            <div class="font-body-3 text-secondary">
              <strong class="text-secondary-900 font-semibold">{{ activeProject.tasksWaiting }} task</strong>
              menunggu untuk diselesaikan
            </div>

            <NuxtLink
              :to="`/projects/${activeProject.workspaceSlug}/workspace`"
              custom
              v-slot="{ navigate }"
            >
              <AtomicButton
                variant="primary"
                size="sm"
                class="w-full sm:w-auto"
                @click="navigate"
              >
                <span>Buka Workspace</span>
                <template #icon-right>
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </template>
              </AtomicButton>
            </NuxtLink>
          </div>
        </OrganismCard>

        <!-- PROFILE COMPLETION CARD -->
        <OrganismCard padding="md" variant="default" class="h-full flex flex-col justify-between">
          <div>
            <h3 class="font-title-3 text-secondary-900">Profilmu hampir lengkap</h3>

            <p class="font-body-3 text-secondary mt-1 leading-relaxed">
              Profil yang lengkap membantu pemilik project memahami skill dan pengalamanmu.
            </p>

            <div class="mt-4 flex items-center justify-between font-label-2 text-muted">
              <span>Kelengkapan profil</span>
              <strong class="text-primary-700 font-bold text-sm">{{ profileScore }}%</strong>
            </div>

            <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                class="h-full rounded-full bg-primary-600 transition-all duration-500 ease-out"
                :style="{ width: `${profileScore}%` }"
              />
            </div>

            <div class="mt-4 rounded-lg bg-primary-50/60 p-3 border border-primary-100 text-secondary">
              <strong class="block font-label-2 text-secondary-900 mb-0.5">Langkah berikutnya</strong>
              <p class="font-body-3 leading-relaxed">Tambahkan karya terbaikmu ke portfolio.</p>
            </div>
          </div>

          <div class="mt-5">
            <NuxtLink to="/profile/me/edit" custom v-slot="{ navigate }">
              <AtomicButton
                variant="outline"
                size="sm"
                block
                @click="navigate"
              >
                Lengkapi Profil
              </AtomicButton>
            </NuxtLink>
          </div>
        </OrganismCard>
      </div>
    </section>

    <!-- =======================================================
     4. RECOMMENDED PROJECTS
    ======================================================== -->
    <section id="recommendedProjects">
      <header class="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 class="font-title-2 text-secondary-900">Project yang cocok untukmu</h2>
          <p class="font-body-2 text-muted mt-0.5">
            Rekomendasi berdasarkan skill dan minat yang ada di profilmu.
          </p>
        </div>

        <NuxtLink
          to="/projects"
          class="shrink-0 inline-flex items-center gap-1 font-label-2 text-primary-700 hover:text-primary-800 hover:underline transition-colors"
        >
          <span>Lihat semua project</span>
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <OrganismCard
          v-for="project in recommendedProjects"
          :key="project.id"
          padding="md"
          variant="default"
          class="h-full flex flex-col justify-between cursor-pointer border border-neutral-200 transition-colors duration-200 hover:border-primary-300 hover:bg-primary-50/30"
          @click="navigateTo(`/projects/${project.slug}`)"
        >
          <div>
            <div class="flex items-start justify-between gap-3 mb-2.5">
              <span class="font-label-3 text-muted uppercase tracking-wider">
                {{ project.category }}
              </span>

              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-lg border transition-colors cursor-pointer shrink-0"
                :class="
                  isBookmarked(project.id)
                    ? 'border-primary-300 bg-primary-50 text-primary-600'
                    : 'border-neutral-200 bg-white text-neutral-400 hover:text-neutral-600 hover:border-neutral-300'
                "
                :aria-label="
                  isBookmarked(project.id)
                    ? 'Hapus project dari simpanan'
                    : 'Simpan project'
                "
                @click.stop="toggleBookmark(project.id, $event)"
              >
                <svg
                  class="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>
            </div>

            <h3 class="font-title-3 text-secondary-900 mb-1.5">
              {{ project.title }}
            </h3>

            <p class="font-body-3 text-secondary line-clamp-2 leading-relaxed mb-3">
              {{ project.description }}
            </p>

            <div class="mb-3.5">
              <AtomicTag variant="success">
                <template #default>
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ project.matchReason }}</span>
                </template>
              </AtomicTag>
            </div>

            <div class="flex flex-wrap gap-1.5 mb-4">
              <AtomicTagCategory
                v-for="(skill, sIdx) in project.skills"
                :key="sIdx"
                variant="default"
              >
                {{ skill }}
              </AtomicTagCategory>
            </div>
          </div>

          <footer class="mt-auto flex items-center justify-between pt-3 border-t border-neutral-100 font-label-2">
            <span class="text-secondary font-medium">{{ project.role }}</span>
            <span class="text-muted text-xs">{{ project.duration }}</span>
          </footer>
        </OrganismCard>
      </div>
    </section>

    <!-- =======================================================
     5. INTEREST SECTION
    ======================================================== -->
    <section>
      <header class="mb-4">
        <h2 class="font-title-2 text-secondary-900">Temukan berdasarkan minat</h2>
        <p class="font-body-2 text-muted mt-0.5">
          Jelajahi project berdasarkan bidang yang ingin kamu eksplor.
        </p>
      </header>

      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          v-for="item in interests"
          :key="item.name"
          type="button"
          class="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white p-4 transition-colors duration-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer focus:outline-none"
          @click="exploreCategory(item.name)"
        >
          <span
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100 group-hover:text-primary-700"
          >
            <!-- Code Icon -->
            <svg
              v-if="item.icon === 'code'"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>

            <!-- CPU Icon -->
            <svg
              v-else-if="item.icon === 'cpu'"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>

            <!-- Book Icon -->
            <svg
              v-else-if="item.icon === 'book'"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>

            <!-- Palette Icon -->
            <svg
              v-else-if="item.icon === 'palette'"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 21a4 4 0 01-4-4 11.042 11.042 0 016.143-9.857A11.042 11.042 0 0119 13a4 4 0 01-4 4H7z" />
            </svg>

            <!-- Briefcase Icon -->
            <svg
              v-else-if="item.icon === 'briefcase'"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>

            <!-- Users Icon -->
            <svg
              v-else-if="item.icon === 'users'"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>

            <!-- Leaf Icon -->
            <svg
              v-else
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>

          <span class="font-label-2 text-secondary group-hover:text-primary-700 text-center transition-colors">
            {{ item.name }}
          </span>
        </button>
      </div>
    </section>

    <!-- =======================================================
     6. OWNER PROJECTS / TEAM BUILDING SECTION
    ======================================================== -->
    <section
      v-if="projectsNeedingMembers.length > 0"
      id="teamBuildingSection"
    >
      <header class="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 class="font-title-2 text-secondary-900">
            Project kamu masih membutuhkan rekan?
          </h2>
          <p id="teamBuildingDescription" class="font-body-2 text-muted mt-0.5">
            {{
              projectsNeedingMembers.length === 1
                ? '1 project yang kamu kelola masih memiliki posisi terbuka.'
                : `${projectsNeedingMembers.length} project yang kamu kelola masih memiliki posisi terbuka.`
            }}
          </p>
        </div>

        <NuxtLink
          to="/projects/my-projects"
          class="shrink-0 inline-flex items-center gap-1 font-label-2 text-primary-700 hover:text-primary-800 hover:underline transition-colors"
          id="viewAllOwnedProjects"
        >
          <span>Lihat Project Saya</span>
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </header>

      <!-- PROJECTS LIST -->
      <div class="flex flex-col gap-3" id="ownerProjectList">
        <OrganismCard
          v-for="project in displayedOwnerProjects"
          :key="project.id"
          padding="none"
          variant="default"
          class="overflow-hidden border border-neutral-200"
        >
          <div class="grid grid-cols-1 lg:grid-cols-[1fr_330px]">
            <!-- LEFT INFO -->
            <div class="p-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="inline-flex items-center gap-1.5 font-label-3 text-primary-700 uppercase tracking-wider mb-2 font-bold">
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Project yang kamu kelola</span>
                  </div>

                  <h3 class="font-title-3 text-secondary-900">
                    {{ project.name }}
                  </h3>

                  <div class="flex items-center gap-2 mt-1.5 font-body-3 text-muted">
                    <span>{{ project.memberCount }} anggota</span>
                    <span class="h-1 w-1 rounded-full bg-neutral-300" />
                    <span>{{ project.openRoles.length }} posisi terbuka</span>
                  </div>
                </div>

                <AtomicTag variant="primary">
                  <span class="h-1.5 w-1.5 rounded-full bg-primary-600 mr-1" />
                  {{ getStatusLabel(project.status) }}
                </AtomicTag>
              </div>

              <!-- ROLES -->
              <div class="mt-5 pt-4 border-t border-neutral-100">
                <span class="block font-label-3 text-muted uppercase tracking-wider mb-2">
                  Posisi yang dibutuhkan
                </span>
                <div class="flex flex-wrap gap-2">
                  <AtomicTagCategory
                    v-for="role in project.openRoles.slice(0, 3)"
                    :key="role.id"
                    variant="default"
                  >
                    {{ role.name }}
                  </AtomicTagCategory>
                  <AtomicTagCategory
                    v-if="project.openRoles.length > 3"
                    variant="default"
                    class="text-muted!"
                  >
                    +{{ project.openRoles.length - 3 }} posisi lainnya
                  </AtomicTagCategory>
                </div>
              </div>
            </div>

            <!-- RIGHT ACTION PANEL -->
            <aside class="p-6 bg-neutral-50/70 border-t lg:border-t-0 lg:border-l border-neutral-200 flex flex-col justify-center">
              <div class="grid grid-cols-2 divide-x divide-neutral-200 mb-4">
                <div class="pr-4">
                  <strong class="block font-title-1 font-bold text-primary-700 leading-none">
                    {{ project.openRoles.length }}
                  </strong>
                  <span class="font-label-3 text-muted mt-1 block">Posisi terbuka</span>
                </div>

                <div class="pl-4">
                  <strong class="block font-title-1 font-bold text-secondary-900 leading-none">
                    {{ getApplicantCount(project) }}
                  </strong>
                  <span class="font-label-3 text-muted mt-1 block">Pelamar</span>
                </div>
              </div>

              <!-- ATTENTION -->
              <div
                v-if="getApplicantCount(project) > 0"
                class="rounded-lg p-2.5 text-xs flex items-center gap-2 mb-4 bg-primary-50 text-primary-800 border border-primary-100"
              >
                <svg class="h-4 w-4 shrink-0 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  <strong>{{ getApplicantCount(project) }} pelamar</strong>
                  menunggu untuk kamu review.
                </span>
              </div>
              <div
                v-else
                class="rounded-lg p-2.5 text-xs flex items-center gap-2 mb-4 bg-neutral-100 text-neutral-600"
              >
                <svg class="h-4 w-4 shrink-0 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Posisi terbuka belum mendapatkan pelamar.</span>
              </div>

              <!-- ACTIONS -->
              <div class="flex gap-2">
                <template v-if="getApplicantCount(project) > 0">
                  <NuxtLink
                    :to="`/projects/${project.id}/applicants`"
                    custom
                    v-slot="{ navigate }"
                  >
                    <AtomicButton
                      variant="primary"
                      size="sm"
                      class="flex-1"
                      @click="navigate"
                    >
                      Kelola Pelamar
                      <template #icon-right>
                        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </template>
                    </AtomicButton>
                  </NuxtLink>

                  <NuxtLink
                    :to="`/projects/${project.id}`"
                    custom
                    v-slot="{ navigate }"
                  >
                    <AtomicButton
                      variant="outline"
                      size="sm"
                      @click="navigate"
                    >
                      Lihat
                    </AtomicButton>
                  </NuxtLink>
                </template>
                <template v-else>
                  <NuxtLink
                    :to="`/projects/${project.id}`"
                    custom
                    v-slot="{ navigate }"
                  >
                    <AtomicButton
                      variant="primary"
                      size="sm"
                      block
                      @click="navigate"
                    >
                      Lihat Project
                      <template #icon-right>
                        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </template>
                    </AtomicButton>
                  </NuxtLink>
                </template>
              </div>
            </aside>
          </div>
        </OrganismCard>
      </div>

      <!-- FOOTER -->
      <footer
        v-if="remainingOwnerProjectsCount > 0"
        class="flex justify-center mt-4"
      >
        <button
          class="inline-flex items-center gap-1 font-label-2 text-primary-700 hover:text-primary-800 hover:underline transition-colors bg-transparent border-none cursor-pointer"
          type="button"
          @click="navigateTo('/projects/my-projects?filter=open-roles')"
        >
          <span>
            Lihat {{ remainingOwnerProjectsCount }} project lainnya yang membutuhkan rekan
          </span>
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </footer>
    </section>

    <!-- =======================================================
     7. NEXT ACTIONS SECTION
    ======================================================== -->
    <section>
      <header class="mb-4">
        <h2 class="font-title-2 text-secondary-900">Langkah berikutnya untukmu</h2>
        <p class="font-body-2 text-muted mt-0.5">
          Beberapa hal yang paling relevan untuk kamu lakukan saat ini.
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OrganismCard
          padding="md"
          variant="default"
          class="border border-neutral-200 bg-white"
        >
          <div class="flex items-start gap-4">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <span class="font-label-3 text-muted tracking-wider uppercase block mb-1">
                Status lamaran
              </span>
              <h3 class="font-title-3 text-secondary-900 mb-1.5">
                2 lamaran sedang menunggu review
              </h3>
              <p class="font-body-3 text-secondary leading-relaxed mb-3">
                Pemilik project sedang mempertimbangkan lamaranmu. Kamu dapat
                memantau perkembangannya dari halaman Lamaranku.
              </p>
              <NuxtLink
                to="/projects/my-applications"
                class="inline-flex items-center gap-1 font-label-2 text-primary-700 hover:text-primary-800 hover:underline transition-colors"
              >
                <span>Lihat status lamaran</span>
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </OrganismCard>

        <OrganismCard padding="md" variant="default">
          <div class="flex items-start gap-4">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <span class="font-label-3 text-muted tracking-wider uppercase block mb-1">
                Profil
              </span>
              <h3 class="font-title-3 text-secondary-900 mb-1.5">
                Tambahkan karya ke portfolio
              </h3>
              <p class="font-body-3 text-secondary leading-relaxed mb-3">
                Profilmu sudah {{ profileScore }}% lengkap. Tambahkan karya yang pernah
                kamu buat agar pemilik project dapat memahami kemampuanmu.
              </p>
              <NuxtLink
                to="/profile/me/edit"
                class="inline-flex items-center gap-1 font-label-2 text-primary-700 hover:text-primary-800 hover:underline transition-colors"
              >
                <span>Lengkapi portfolio</span>
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </OrganismCard>
      </div>
    </section>
  </div>
</template>
