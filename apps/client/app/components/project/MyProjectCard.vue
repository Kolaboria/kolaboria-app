<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  Ellipsis,
  SquarePen,
  Users,
  LayoutDashboard,
  Archive,
  ArrowRight
} from '@lucide/vue'
import type { MyProjectSummaryResponse } from '~/types/project-editor'
import { getProjectCategoryLabel } from '~/constants/projectCategory'

const props = defineProps<{
  project: MyProjectSummaryResponse
  currentUserId: string
  pendingApplicantsCount?: number
  roles?: Array<{ name: string; capacity: number }>
}>()

const emit = defineEmits<{
  (e: 'archive', id: string): void
}>()

const isMenuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const toggleMenu = (event: Event) => {
  event.stopPropagation()
  isMenuOpen.value = !isMenuOpen.value
}

const handleArchiveProject = () => {
  isMenuOpen.value = false
  emit('archive', props.project.id)
}

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    isMenuOpen.value = false
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    document.addEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', handleClickOutside)
  }
})

// Origin labels matching design reference
const originLabel = computed(() => {
  switch (props.project.origin) {
    case 'client':
      return 'Proyek client'
    case 'experiment':
      return 'Eksperimen'
    case 'community':
      return 'Komunitas'
    case 'personal':
      return 'Proyek pribadi'
    default:
      return 'Proyek pribadi'
  }
})

// Origin variant for AtomicTagCategory
const originVariant = computed<'default' | 'warning' | 'info'>(() => {
  switch (props.project.origin) {
    case 'client':
      return 'warning'
    case 'community':
      return 'info'
    case 'experiment':
    case 'personal':
    default:
      return 'default'
  }
})

// Status labels matching design reference
const statusLabel = computed(() => {
  switch (props.project.status) {
    case 'draft':
      return 'Draft'
    case 'open':
      return 'Menerima Kontributor'
    case 'in_progress':
      return 'Berjalan'
    case 'completed':
      return 'Selesai'
    case 'archived':
      return 'Arsip'
    default:
      return 'Draft'
  }
})

// Status variant for AtomicTagCategory
const statusVariant = computed<'default' | 'success' | 'info' | 'primary'>(
  () => {
    switch (props.project.status) {
      case 'open':
        return 'success'
      case 'in_progress':
        return 'info'
      case 'completed':
        return 'primary'
      case 'draft':
      case 'archived':
      default:
        return 'default'
    }
  }
)

// Category label formatting
const categoryLabel = computed(() => {
  if (props.project.project_category === 'product') {
    return 'Aplikasi Web'
  }
  return getProjectCategoryLabel(props.project.project_category)
})

// Commitment hours text
const hoursText = computed(() => {
  if (props.project.hours_per_week) {
    return `${props.project.hours_per_week} jam/minggu`
  }
  return 'Fleksibel'
})

// Target deadline formatting: e.g. "Target 20 Jan 2027"
const deadlineText = computed(() => {
  if (!props.project.deadline) return 'Target fleksibel'
  const date = new Date(props.project.deadline)
  if (Number.isNaN(date.getTime())) return 'Target fleksibel'
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des'
  ]
  return `Target ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
})

// Team requirements / positions needed
const isExperiment = computed(() => props.project.origin === 'experiment')

const displayRoles = computed(() => {
  if (props.roles && props.roles.length > 0) {
    return props.roles
  }
  // Fallback to top skills with capacity
  if (props.project.skills && props.project.skills.length > 0) {
    return props.project.skills.slice(0, 2).map((s, idx) => ({
      name: s.name,
      capacity: idx === 0 ? Math.max(1, props.project.total_capacity || 1) : 1
    }))
  }
  return [
    {
      name: categoryLabel.value,
      capacity: props.project.total_capacity || 1
    }
  ]
})

// Management URL destination
const manageUrl = computed(() => {
  if (props.project.status === 'draft') {
    return `/projects/${props.project.slug}/edit`
  }
  return `/projects/${props.project.slug}/workspace`
})

const pendingCount = computed(() => props.pendingApplicantsCount ?? 0)
</script>

<template>
  <OrganismCard
    variant="default"
    padding="none"
    class="group relative h-full overflow-visible! border-neutral-200 transition-all hover:border-neutral-300 hover:shadow-sm"
  >
    <NuxtLink
      :to="`/projects/${project.slug}`"
      class="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
      :aria-label="`Buka detail proyek ${project.title}`"
    />
    <div
      class="pointer-events-none relative z-10 flex h-full flex-col justify-between p-5 sm:p-6"
    >
      <div>
        <!-- ─── TOP BADGES & ACTIONS ROW ─── -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <!-- Status Badge (AtomicTagCategory) -->
            <AtomicTagCategory :variant="statusVariant">
              {{ statusLabel }}
            </AtomicTagCategory>

            <!-- Context / Origin Badge (AtomicTagCategory) -->
            <AtomicTagCategory :variant="originVariant">
              {{ originLabel }}
            </AtomicTagCategory>
          </div>

          <!-- Three-dots Action Button (AtomicIconButton) -->
          <div ref="menuRef" class="relative pointer-events-auto">
            <AtomicIconButton
              variant="outline"
              shape="square"
              size="sm"
              title="Menu opsi proyek"
              aria-label="Menu opsi proyek"
              @click="toggleMenu"
            >
              <Ellipsis class="size-4 text-secondary" />
            </AtomicIconButton>

            <!-- Dropdown Menu -->
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="scale-95 opacity-0"
              enter-to-class="scale-100 opacity-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="scale-100 opacity-100"
              leave-to-class="scale-95 opacity-0"
            >
              <div
                v-if="isMenuOpen"
                class="absolute right-0 z-30 mt-2 w-48 origin-top-right rounded-xl border border-neutral-200 bg-white py-1.5 shadow-lg"
              >
                <NuxtLink
                  :to="`/projects/${project.slug}/edit`"
                  class="flex items-center gap-2 px-3.5 py-2 font-body-2 text-secondary transition-colors hover:bg-neutral-50 hover:text-primary"
                  @click="isMenuOpen = false"
                >
                  <SquarePen class="size-4 text-tertiary" />
                  Edit Proyek
                </NuxtLink>

                <NuxtLink
                  v-if="pendingApplicantsCount !== undefined && pendingCount > 0"
                  :to="`/projects/${project.slug}/applicants`"
                  class="flex items-center gap-2 px-3.5 py-2 font-body-2 text-secondary transition-colors hover:bg-neutral-50 hover:text-primary"
                  @click="isMenuOpen = false"
                >
                  <Users class="size-4 text-tertiary" />
                  Tinjau Pelamar
                </NuxtLink>

                <NuxtLink
                  :to="`/projects/${project.slug}/workspace`"
                  class="flex items-center gap-2 px-3.5 py-2 font-body-2 text-secondary transition-colors hover:bg-neutral-50 hover:text-primary"
                  @click="isMenuOpen = false"
                >
                  <LayoutDashboard class="size-4 text-tertiary" />
                  Ruang Kerja
                </NuxtLink>

                <div class="my-1 border-t border-neutral-100" />

                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-3.5 py-2 font-body-2 text-secondary transition-colors hover:bg-neutral-50 hover:text-danger-700"
                  @click="handleArchiveProject()"
                >
                  <Archive class="size-4 text-tertiary" />
                  Arsipkan Proyek
                </button>
              </div>
            </transition>
          </div>
        </div>

        <!-- ─── PROJECT TITLE ─── -->
        <h2
          class="mt-3.5 font-title-2 font-bold text-primary transition-colors group-hover:text-brand"
        >
          {{ project.title }}
        </h2>

        <!-- ─── PROJECT SUMMARY ─── -->
        <p class="mt-2 line-clamp-2 font-body-2 text-secondary leading-relaxed">
          {{ project.summary || 'Belum ada ringkasan proyek.' }}
        </p>

        <!-- ─── METADATA ROW ─── -->
        <div
          class="mt-3 flex flex-wrap items-center gap-1.5 font-label-3 text-muted"
        >
          <span>{{ categoryLabel }}</span>
          <span class="text-tertiary select-none">·</span>
          <span>{{ hoursText }}</span>
          <span class="text-tertiary select-none">·</span>
          <span>{{ deadlineText }}</span>
        </div>

        <!-- ─── TEAM REQUIREMENTS SECTION ─── -->
        <div class="mt-4.5">
          <p class="mb-2 font-label-3 text-secondary">
            {{ isExperiment ? 'Posisi yang dibutuhkan' : 'Kebutuhan tim' }}
          </p>
          <div class="flex flex-wrap gap-2">
            <AtomicTagCategory
              v-for="(role, idx) in displayRoles"
              :key="idx"
              variant="default"
            >
              {{ role.name }} · {{ role.capacity }}
            </AtomicTagCategory>
          </div>
        </div>
      </div>

      <!-- ─── FOOTER DIVIDER & ACTIONS ─── -->
      <div class="mt-6 border-t border-neutral-200 pt-4 space-y-3">
        <!-- Slot Info -->
        <div class="flex items-center justify-between font-label-3">
          <span class="font-body-3 text-muted">Kontributor tergabung</span>
          <span class="text-primary">
            {{ project.filled_capacity }} dari
            {{ project.total_capacity || 1 }} posisi
          </span>
        </div>

        <!-- Bottom Action Row -->
        <div
          v-if="pendingApplicantsCount !== undefined"
          class="flex items-center justify-between gap-3 pt-0.5"
        >
          <!-- Left Application Notice -->
          <div
            v-if="pendingCount > 0"
            class="flex items-center gap-1 font-body-3"
          >
            <span class="font-label-3 text-accent-600"
              >{{ pendingCount }} pengajuan</span
            >
            <span class="text-muted">menunggu ditinjau</span>
          </div>
          <div v-else class="font-body-3 text-tertiary">
            Tidak ada pengajuan baru
          </div>

          <!-- Right Action Button (AtomicButton) -->
          <div class="pointer-events-auto">
            <AtomicButton
              v-if="pendingCount > 0"
              :to="`/projects/${project.slug}/applicants`"
              label="Tinjau Pengajuan"
              variant="primary"
              size="sm"
            >
              <template #icon-right>
                <ArrowRight class="size-4" />
              </template>
            </AtomicButton>
          </div>
        </div>
      </div>
    </div>
  </OrganismCard>
</template>
