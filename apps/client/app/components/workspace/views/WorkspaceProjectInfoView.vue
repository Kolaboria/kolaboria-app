<script setup lang="ts">
import { computed } from "vue";
import { Play, RotateCw } from "@lucide/vue";
import type { WorkspaceProjectInfoContext } from "~/composables/useWorkspaceController";
import type { WorkspaceProjectInfoViewModel } from "~/types/workspace-info";

const props = defineProps<{
  info: WorkspaceProjectInfoViewModel | null;
  context: WorkspaceProjectInfoContext;
  loading: boolean;
  error: string | null;
  confirmingStart: boolean;
  starting: boolean;
  startError: string | null;
}>();

const emit = defineEmits<{
  retry: [];
  "start-request": [];
  "start-confirm": [];
  "start-cancel": [];
}>();

const {
  canClose,
  activeTaskCount,
  completedTaskCount,
  progress,
  openTasks,
  closedTasks,
} = props.context;

const underfilledPositions = computed(
  () => props.info?.positions.filter((position) => position.remainingCapacity > 0) ?? [],
);
const hasUnderfilledPositions = computed(
  () => (props.info?.positionCapacitySummary.totalRemainingCapacity ?? 0) > 0,
);
</script>

<template>
  <div v-if="loading" class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]" aria-label="Memuat informasi proyek">
    <div class="grid gap-4">
      <div class="h-52 animate-pulse rounded-xl bg-white" />
      <div class="h-56 animate-pulse rounded-xl bg-white" />
    </div>
    <div class="h-56 animate-pulse rounded-xl bg-white lg:col-start-2 lg:row-start-1" />
  </div>

  <section v-else-if="error" class="rounded-xl border border-neutral-200 bg-white p-6 text-center">
    <h2 class="font-title-3 text-secondary-900">Informasi proyek belum dapat dimuat</h2>
    <p class="mx-auto mt-2 max-w-lg font-body-2 text-neutral-600">{{ error }}</p>
    <AtomicButton class="mt-4" variant="primary" size="sm" @click="emit('retry')">
      <template #icon-left><RotateCw class="h-4 w-4" aria-hidden="true" /></template>
      Coba lagi
    </AtomicButton>
  </section>

  <section v-else-if="info" class="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
    <div class="grid items-start gap-4">
      <section class="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-label-3 uppercase tracking-wide text-primary-700">Informasi proyek</p>
            <h2 class="mt-1 font-title-3 text-secondary-900">{{ info.project.title }}</h2>
            <p v-if="info.project.summary" class="mt-2 font-body-2 text-secondary-800">
              {{ info.project.summary }}
            </p>
            <p v-if="info.project.description" class="mt-1.5 whitespace-pre-line font-body-2 text-neutral-600">
              {{ info.project.description }}
            </p>
          </div>
          <AtomicTag :variant="info.project.status === 'completed' ? 'success' : info.project.status === 'open' ? 'warning' : 'primary'">
            {{ info.project.statusLabel }}
          </AtomicTag>
        </div>

        <dl class="mt-4 divide-y divide-neutral-100 border-t border-neutral-100">
          <div class="flex items-start justify-between gap-4 py-3">
            <dt class="font-label-3 text-secondary-800">Project Owner</dt>
            <dd class="text-right font-body-2 text-neutral-600">{{ info.project.ownerName }}</dd>
          </div>
          <div v-if="info.project.initiatorOrganizationName" class="flex items-start justify-between gap-4 py-3">
            <dt class="font-label-3 text-secondary-800">Diinisiasi oleh</dt>
            <dd class="text-right font-body-2 text-neutral-600">
              {{ info.project.initiatorOrganizationName }}
              <span v-if="info.project.initiatorPersonName" class="block text-neutral-500">{{ info.project.initiatorPersonName }}</span>
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 py-3">
            <dt class="font-label-3 text-secondary-800">Kategori</dt>
            <dd class="text-right font-body-2 text-neutral-600">{{ info.project.projectCategory || "Belum ditentukan" }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4 py-3">
            <dt class="font-label-3 text-secondary-800">Mulai yang direncanakan</dt>
            <dd class="text-right font-body-2 text-neutral-600">{{ info.project.startDateLabel }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4 py-3">
            <dt class="font-label-3 text-secondary-800">Target selesai</dt>
            <dd class="text-right font-body-2 text-neutral-600">{{ info.project.deadlineLabel }}</dd>
          </div>
        </dl>
      </section>

      <section class="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="font-title-3 text-secondary-900">Kesiapan peran</h2>
            <p class="mt-1 font-body-3 text-neutral-500">Kesiapan dihitung dari kuota dan contributor aktif yang diterima.</p>
          </div>
          <AtomicTag>{{ info.positions.length }} peran</AtomicTag>
        </div>

        <div v-if="info.positions.length" class="mt-3 divide-y divide-neutral-100">
          <div v-for="position in info.positions" :key="position.id" class="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p class="font-label-2 text-secondary-800">{{ position.name }}</p>
              <p class="mt-0.5 font-body-3 text-neutral-500">
                {{ position.occupancyLabel }} contributor aktif
                <span v-if="position.remainingCapacity"> · sisa {{ position.remainingCapacity }} slot</span>
              </p>
            </div>
            <AtomicTag :variant="position.readinessState === 'ready' ? 'success' : 'warning'">
              {{ position.readinessLabel }}
            </AtomicTag>
          </div>
        </div>
        <p v-else class="mt-4 rounded-lg bg-neutral-50 p-3 font-body-3 text-neutral-600">
          Belum ada posisi aktif yang tercatat pada proyek ini.
        </p>

        <div v-if="info.project.status === 'open'" class="mt-4 border-t border-neutral-100 pt-4">
          <AtomicButton v-if="info.canStartProject" variant="primary" size="sm" @click="emit('start-request')">
            <template #icon-left><Play class="h-4 w-4" aria-hidden="true" /></template>
            Mulai proyek
          </AtomicButton>
          <p v-else class="font-body-3 text-neutral-500">Owner atau pengelola proyek dapat memulai proyek.</p>
        </div>
      </section>
    </div>

    <section class="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 lg:col-start-2 lg:row-start-1">
      <div class="flex items-center justify-between gap-2">
        <h2 class="font-title-3 text-secondary-900">Penutupan proyek</h2>
        <AtomicTag variant="default">Data prototipe</AtomicTag>
      </div>
      <p class="mt-1.5 font-body-2 text-neutral-600">
        Owner meninjau hasil setelah seluruh task selesai atau ditutup dengan alasan perubahan scope.
      </p>
      <div class="mt-4 space-y-2 rounded-lg bg-neutral-50 p-3">
        <div class="flex items-center justify-between gap-2">
          <span class="font-body-3 text-neutral-700">Task selesai</span>
          <span class="font-label-3 text-secondary-800">{{ completedTaskCount }} / {{ activeTaskCount }}</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-neutral-200">
          <div class="h-full rounded-full bg-success-500" :style="{ width: `${progress}%` }" />
        </div>
        <p class="font-body-3" :class="canClose ? 'text-success-700' : 'text-neutral-500'">
          {{ canClose ? "Semua task memenuhi syarat untuk direview." : `${openTasks.length} task masih perlu diselesaikan atau ditinjau.` }}
        </p>
        <p v-if="closedTasks.length" class="font-body-3 text-neutral-500">
          {{ closedTasks.length }} task ditutup karena perubahan scope dan tidak dihitung sebagai hasil.
        </p>
      </div>
    </section>
  </section>

  <OrganismModal
    :model-value="confirmingStart && Boolean(info)"
    :title="hasUnderfilledPositions ? 'Mulai dengan kuota belum penuh?' : 'Mulai proyek sekarang?'"
    :show-close="false"
    :persistent="true"
    size="sm"
    @close="emit('start-cancel')"
  >
    <template #description>
      <p class="font-body-2 text-neutral-600">
        <template v-if="hasUnderfilledPositions">
          Ada {{ info?.positionCapacitySummary.underfilledPositionCount }} peran dengan {{ info?.positionCapacitySummary.totalRemainingCapacity }} slot yang masih dapat diisi. Kamu tetap bisa memulai proyek setelah meninjau kuota berikut.
        </template>
        <template v-else>Kuota semua peran yang tercatat sudah terpenuhi. Proyek akan berubah menjadi sedang berjalan.</template>
      </p>
    </template>

    <template v-if="info">
      <ul v-if="hasUnderfilledPositions" class="mt-3 space-y-2 rounded-lg bg-warning-50 p-3">
        <li v-for="position in underfilledPositions" :key="position.id" class="font-body-3 text-secondary-800">
          <span class="font-label-3">{{ position.name }}</span> — {{ position.occupancyLabel }} terisi, {{ position.remainingCapacity }} slot tersisa
        </li>
      </ul>
      <p v-if="startError" role="alert" class="mt-3 rounded-lg bg-danger-50 p-3 font-body-3 text-danger-800">{{ startError }}</p>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2" @keydown.esc.stop="emit('start-cancel')">
        <AtomicButton variant="outline" size="sm" :disabled="starting" @click="emit('start-cancel')">Batal</AtomicButton>
        <AtomicButton variant="primary" size="sm" :disabled="starting" @click="emit('start-confirm')">
          {{ starting ? "Memulai…" : "Tetap mulai" }}
        </AtomicButton>
      </div>
    </template>
  </OrganismModal>
</template>
