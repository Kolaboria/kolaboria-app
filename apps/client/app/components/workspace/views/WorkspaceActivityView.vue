<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Activity } from '@lucide/vue'
import type { WorkspaceActivityContext } from '~/composables/useWorkspaceController'
import { paginateItems } from '~/utils/workspace-presentation'
import { personFor, projectActivityList } from '~/utils/workspace-prototype-state'

const props = defineProps<{ context: WorkspaceActivityContext }>()
const { state, currentProject, timeLabel } = props.context
const activities = computed(() => projectActivityList(currentProject.value))

const activityPageSize = 50
const desktopPage = ref(1)
const mobileVisibleCount = ref(activityPageSize)
const isMobile = ref(false)
const loadMoreSentinel = ref<HTMLElement | null>(null)
const pageCount = computed(() => Math.ceil(activities.value.length / activityPageSize))
const pageResult = computed(() =>
  paginateItems(activities.value, desktopPage.value, activityPageSize),
)
const visibleActivities = computed(() =>
  isMobile.value
    ? activities.value.slice(0, mobileVisibleCount.value)
    : pageResult.value.items,
)
const hasMoreMobile = computed(
  () => isMobile.value && mobileVisibleCount.value < activities.value.length,
)

let mobileMediaQuery: MediaQueryList | null = null
let activityObserver: IntersectionObserver | null = null

const loadMore = () => {
  mobileVisibleCount.value = Math.min(
    mobileVisibleCount.value + activityPageSize,
    activities.value.length,
  )
}

const syncMobileMode = (event?: MediaQueryListEvent) => {
  isMobile.value = event?.matches ?? mobileMediaQuery?.matches ?? false
}

watch(loadMoreSentinel, (sentinel, previous) => {
  if (previous) activityObserver?.unobserve(previous)
  if (sentinel) activityObserver?.observe(sentinel)
})

watch(
  () => currentProject.value?.id,
  () => {
    desktopPage.value = 1
    mobileVisibleCount.value = activityPageSize
  },
)

watch(
  () => activities.value.length,
  () => {
    desktopPage.value = Math.min(desktopPage.value, Math.max(1, pageCount.value))
    mobileVisibleCount.value = Math.min(
      Math.max(activityPageSize, mobileVisibleCount.value),
      activities.value.length,
    )
  },
)

onMounted(() => {
  mobileMediaQuery = window.matchMedia('(max-width: 1023px)')
  syncMobileMode()
  mobileMediaQuery.addEventListener('change', syncMobileMode)

  if ('IntersectionObserver' in window) {
    activityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore()
      },
      { rootMargin: '200px 0px' },
    )
    if (loadMoreSentinel.value) activityObserver.observe(loadMoreSentinel.value)
  }
})

onBeforeUnmount(() => {
  mobileMediaQuery?.removeEventListener('change', syncMobileMode)
  activityObserver?.disconnect()
})
</script>

<template>
  <section class="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
    <div class="mb-3 flex items-center justify-between gap-3">
      <div>
        <h2 class="font-title-3 text-secondary-900">
          Aktivitas proyek
        </h2>
        <p class="mt-1 font-body-3 text-neutral-500">
          Perubahan pekerjaan, diskusi, dan keputusan proyek.
        </p>
      </div>
      <AtomicTag>{{ activities.length }} aktivitas</AtomicTag>
    </div>
    <div v-if="activities.length" class="divide-y divide-neutral-100">
      <div
        v-for="activity in visibleActivities"
        :key="activity.id"
        class="flex gap-3 py-4 first:pt-2"
      >
        <span
          class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700"
        >
          <Activity class="h-4 w-4" aria-hidden="true" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="font-body-2 text-secondary-800">
            <strong class="font-label-3">{{ personFor(state, activity.actorId)?.name }}</strong>
            {{ activity.text }}
          </p>
          <p class="mt-1 font-body-3 text-neutral-500">
            {{ timeLabel(activity.createdAt) }}
          </p>
        </div>
      </div>
    </div>
    <div v-else class="py-10 text-center font-body-2 text-neutral-500">
      Aktivitas proyek akan tercatat setelah tim mulai berkolaborasi.
    </div>

    <div
      v-if="isMobile && hasMoreMobile"
      ref="loadMoreSentinel"
      class="flex justify-center border-t border-neutral-100 pt-4"
    >
      <AtomicButton variant="text-button" @click="loadMore">
        Muat aktivitas lainnya
      </AtomicButton>
    </div>

    <div
      v-if="!isMobile && activities.length"
      class="mt-4 flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="font-body-3 text-neutral-500" aria-live="polite">
        Menampilkan
        <strong class="font-label-3 text-neutral-700">{{ pageResult.total ? (pageResult.page - 1) * activityPageSize + 1 : 0 }}–{{ Math.min(pageResult.page * activityPageSize, pageResult.total) }}</strong>
        dari <strong class="font-label-3 text-neutral-700">{{ pageResult.total }}</strong> aktivitas
      </p>
      <MoleculePagination
        v-if="pageCount > 1"
        v-model="desktopPage"
        :total-pages="pageCount"
        :per-page="activityPageSize"
        align="end"
      />
    </div>
  </section>
</template>
