<script setup lang="ts">
import type { ProfileExperience } from '../../types/profile-page'
defineProps<{ experiences: ProfileExperience[] | null; isOwner?: boolean }>()
</script>
<template>
  <section aria-labelledby="verified-experiences-title" class="space-y-4">
    <div class="flex items-end justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-primary-700">Bukti kontribusi</p>
        <h2 id="verified-experiences-title" class="mt-1 text-xl font-semibold text-secondary-900">Verified Project Experiences</h2>
        <p class="mt-1 text-sm text-neutral-500">Ringkasan kontribusi yang dihasilkan dari project yang telah selesai.</p>
      </div>
      <NuxtLink
        v-if="isOwner"
        to="/profile/me/experiences"
        custom
        v-slot="{ navigate }"
      >
        <AtomicButton variant="ghost" size="sm" @click="navigate">Kelola Rekam</AtomicButton>
      </NuxtLink>
    </div>
    <div v-if="experiences === null" class="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">Rekam kontribusi belum dapat ditampilkan saat ini.</div>
    <div v-else-if="experiences.length" class="space-y-4"><ExperienceCard v-for="experience in experiences" :key="experience.id" :experience="experience" :owner="isOwner" /></div>
    <div v-else class="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">Belum ada rekam kontribusi publik. Setelah project selesai, rekam akan dikumpulkan otomatis dan tetap privat sampai Anda memilih untuk membagikannya.</div>
  </section>
</template>
