<script setup lang="ts">
import { CircleCheck } from '@lucide/vue'
import type { WorkspaceProjectCloseDialogContext } from '~/composables/useWorkspaceController'

const props = defineProps<{ context: WorkspaceProjectCloseDialogContext }>()
const { completedTaskCount, closedTasks, resultSummary, outcomeError } = props.context
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-xl border border-success-200 bg-success-50 p-4">
      <div class="flex items-center gap-2 font-label-2 text-success-900">
        <CircleCheck class="h-5 w-5" aria-hidden="true" />Semua task
        memenuhi syarat
      </div>
      <p class="mt-1 font-body-3 text-success-900/80">
        {{ completedTaskCount }} task selesai<span
        v-if="closedTasks.length"
        >
        · {{ closedTasks.length }} task dikeluarkan dari scope dengan
        alasan</span
        >.
      </p>
    </div>
    <div class="rounded-xl border border-neutral-200 p-4">
      <h3 class="font-label-2 text-secondary-900">Hasil proyek</h3>
        <p class="mt-1 font-body-3 text-neutral-500">
          Tinjau keluaran dan tuliskan keputusan penutupan sebagai owner
          atau lead. Rekam kontribusi akan diusulkan setelah proyek ditutup.
        </p>
        <MoleculeTextarea
          v-model="resultSummary"
          label="Ringkasan hasil"
          placeholder="Apa yang berhasil dicapai tim? Sertakan konteks hasil review..."
          :rows="4"
          class="mt-3"
          required
        />
      </div>
      <p
        v-if="outcomeError"
        class="rounded-lg bg-danger-50 p-3 font-body-3 text-danger-700"
        role="alert"
        >
        {{ outcomeError }}
      </p>
      <p class="font-body-3 text-neutral-500">
        Penutupan proyek tidak menunggu tinjauan rekam kontribusi setiap
        anggota.
      </p>
    </div>
</template>
