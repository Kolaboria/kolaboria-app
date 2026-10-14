<script setup lang="ts">
import type { Project } from '../../types/project'

const { getRecentProjects } = useProjects()

const recentProjects = ref<Project[]>([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    recentProjects.value = await getRecentProjects(12)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <section>
    <!-- Page Header -->
    <div
      class="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
    >
      <div>
        <p class="mt-1 font-title-1">Temukan Proyek Baru</p>
        <p class="mt-2 font-body-1 text-secondary">
          Proyek open dan komersial yang membutuhkan kontribusimu.
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-3">
        <AtomicButton variant="outline" @click="navigateTo('/projects')">
          Lihat Semua Projek
        </AtomicButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="i in 3"
        :key="i"
        class="h-[300px] animate-pulse rounded-2xl bg-neutral-100 ring-1 ring-inset ring-neutral-200"
      />
    </div>

    <!-- Empty State -->
    <OrganismEmptyState
      v-else-if="recentProjects.length === 0"
      title="Belum Ada Project"
      description="Jadilah yang pertama untuk membuat project dan mulai kolaborasi dengan talenta di Kolaboria."
      class="border border-dashed border-neutral-300 py-16"
    >
      <template #action>
        <NuxtLink
          to="/projects/create"
          custom
          v-slot="{ navigate }"
        >
          <AtomicButton variant="primary" @click="navigate">
            Mulai Project Pertama
          </AtomicButton>
        </NuxtLink>
      </template>
    </OrganismEmptyState>

    <!-- Project Grid -->
    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ProjectCard
        v-for="project in recentProjects"
        :key="project.id"
        :project="project"
      />
    </div>
  </section>
</template>
