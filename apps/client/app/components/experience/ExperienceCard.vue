<script setup lang="ts">
import type { ExperienceCardSummary } from '../../types/experience'

const props = defineProps<{ experience: ExperienceCardSummary; owner?: boolean }>()
const href = computed(() =>
  props.owner
    ? `/profile/me/experiences/${props.experience.slug}`
    : `/@/${props.experience.username}/experiences/${props.experience.slug}`
)
</script>
<template>
  <article class="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p
          class="text-xs font-semibold uppercase tracking-wide text-primary-700"
        >
          {{ experience.contribution_role }}
        </p>
        <h3 class="mt-1 text-lg font-semibold text-secondary-900">
          {{ experience.project_title }}
        </h3>
        <p class="mt-1 text-sm text-neutral-500">
          {{ experience.record_status_label }} ·
          {{ experience.visibility_label }}
        </p>
      </div>
      <span
        v-if="experience.integrity_status === 'valid'"
        class="rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700"
        >Terverifikasi</span
      >
    </div>
    <p class="mt-3 line-clamp-2 text-sm text-neutral-600">
      {{ experience.project_summary }}
    </p>
    <div
      class="mt-4 grid grid-cols-2 gap-2 text-sm text-neutral-600 sm:grid-cols-4"
    >
      <span>{{ experience.metrics.completed_tasks }} task selesai</span
      ><span>{{ experience.metrics.discussions }} diskusi</span
      ><span>{{ experience.metrics.deliverables }} deliverable</span
      ><span>{{ experience.metrics.team_size }} anggota</span>
    </div>
    <div class="mt-5">
      <NuxtLink
        :to="href"
        custom
        v-slot="{ navigate }"
      >
        <AtomicButton variant="secondary" size="sm" @click="navigate">
          Lihat Rekam Kontribusi
        </AtomicButton>
      </NuxtLink>
    </div>
  </article>
</template>
