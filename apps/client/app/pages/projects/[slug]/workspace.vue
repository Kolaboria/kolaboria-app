<script setup lang="ts">
definePageMeta({
  layout: "workspace",
  middleware: ["auth", "onboarding-guard"],
});
</script>

<template>
  <NuxtPage />
</template>
