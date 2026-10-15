<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { MessagesSquare, Pencil, Plus, Trash2 } from "@lucide/vue";
import { useWorkspaceDiscussions } from "~/composables/useWorkspaceDiscussions";
import { useWorkspaceProjectInfo } from "~/composables/useWorkspaceProjectInfo";
import { projectWorkspaceDiscussionPath } from "~/utils/workspace-paths";

const props = defineProps<{ projectSlug: string }>();
const discussions = useWorkspaceDiscussions(() => props.projectSlug);
const projectInfo = useWorkspaceProjectInfo(toRef(props, "projectSlug"));
const canWrite = computed(
  () => projectInfo.data.value?.project.status === "in_progress",
);
const {
  discussionPage,
  listPending,
  moreListPending,
  mutationPending,
  mutationError,
  listErrorMessage,
  retryList,
  loadMoreDiscussions,
  createDiscussion,
  getDiscussionById,
  updateDiscussionById,
  deleteDiscussionById,
  clearMutationError,
} = discussions;

const createDialogOpen = ref(false);
const editDialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const draftTitle = ref("");
const draftBody = ref("");
const editingDiscussionId = ref<string | null>(null);
const deletingDiscussionId = ref<string | null>(null);
const deletingDiscussion = computed(
  () =>
    discussionPage.value.items.find(
      (item) => item.id === deletingDiscussionId.value,
    ) ?? null,
);

const openCreateDialog = () => {
  clearMutationError();
  createDialogOpen.value = true;
};

const openEditDialog = async (discussionId: string) => {
  const item = discussionPage.value.items.find(
    (candidate) => candidate.id === discussionId,
  );
  if (!item?.canEdit) return;
  clearMutationError();
  const detail = await getDiscussionById(discussionId);
  if (!detail?.canEdit) return;
  editingDiscussionId.value = item.id;
  draftTitle.value = detail.title;
  draftBody.value = detail.body;
  editDialogOpen.value = true;
};

const submitCreate = async () => {
  const saved = await createDiscussion({
    title: draftTitle.value,
    body: draftBody.value,
  });
  if (!saved) return;
  draftTitle.value = "";
  draftBody.value = "";
  createDialogOpen.value = false;
};

const submitEdit = async () => {
  if (!editingDiscussionId.value) return;
  const saved = await updateDiscussionById(editingDiscussionId.value, {
    title: draftTitle.value,
    body: draftBody.value,
  });
  if (saved) {
    editDialogOpen.value = false;
    editingDiscussionId.value = null;
  }
};

const confirmDelete = async () => {
  if (!deletingDiscussionId.value) return;
  const deleted = await deleteDiscussionById(deletingDiscussionId.value);
  if (deleted) {
    deleteDialogOpen.value = false;
    deletingDiscussionId.value = null;
  }
};

const openDeleteDialog = (discussionId: string) => {
  if (
    !discussionPage.value.items.find((item) => item.id === discussionId)
      ?.canDelete
  )
    return;
  clearMutationError();
  deletingDiscussionId.value = discussionId;
  deleteDialogOpen.value = true;
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Waktu tidak tersedia"
    : new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};
</script>

<template>
  <section class="space-y-4" aria-label="Diskusi proyek">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="font-body-3 text-neutral-500">
        Topik dan keputusan yang tersimpan untuk
        {{ projectInfo.data.value?.project.title || "proyek ini" }}.
      </p>
      <AtomicButton
        v-if="canWrite && discussionPage.items.length > 0"
        variant="primary"
        size="sm"
        @click="openCreateDialog"
      >
        <template #icon-left
          ><Plus class="h-4 w-4" aria-hidden="true"
        /></template>
        Mulai diskusi
      </AtomicButton>
    </div>

    <div
      v-if="listPending"
      class="rounded-xl border border-neutral-200 bg-white px-5 py-10 text-center"
      role="status"
    >
      <p class="font-body-2 text-neutral-500">Memuat diskusi proyek…</p>
    </div>

    <div
      v-else-if="listErrorMessage"
      class="rounded-xl border border-danger-200 bg-white px-5 py-8 text-center"
      role="alert"
    >
      <p class="font-label-2 text-secondary-900">Diskusi belum dapat dimuat</p>
      <p class="mt-1 font-body-3 text-neutral-600">{{ listErrorMessage }}</p>
      <AtomicButton variant="outline" size="sm" class="mt-4" @click="retryList"
        >Coba lagi</AtomicButton
      >
    </div>

    <div v-else-if="discussionPage.items.length" class="space-y-3">
      <article
        v-for="item in discussionPage.items"
        :key="item.id"
        class="rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-primary-300 sm:p-5"
      >
        <div class="flex items-start gap-3 sm:gap-4">
          <AtomicAvatar :name="item.author.name" :size="'sm'" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <NuxtLink
                  :to="projectWorkspaceDiscussionPath(projectSlug, item.id)"
                  class="break-words font-title-3 text-secondary-900 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {{ item.title }}
                </NuxtLink>
                <p class="mt-1 font-body-3 text-neutral-500">
                  {{ item.author.name }} · Aktivitas
                  {{ formatDate(item.lastActivityAt) }}
                </p>
              </div>
              <div
                v-if="item.canEdit || item.canDelete"
                class="flex shrink-0 items-center gap-1"
              >
                <AtomicButton
                  v-if="item.canEdit"
                  variant="ghost"
                  size="sm"
                  :aria-label="`Edit ${item.title}`"
                  @click="openEditDialog(item.id)"
                >
                  <Pencil class="h-4 w-4" aria-hidden="true" />
                </AtomicButton>
                <AtomicButton
                  v-if="item.canDelete"
                  variant="danger"
                  size="sm"
                  :aria-label="`Hapus ${item.title}`"
                  @click="openDeleteDialog(item.id)"
                >
                  <Trash2 class="h-4 w-4" aria-hidden="true" />
                </AtomicButton>
              </div>
            </div>
            <p
              class="mt-3 line-clamp-3 whitespace-pre-wrap break-words font-body-2 leading-relaxed text-neutral-700"
            >
              {{ item.bodyPreview }}
            </p>
            <div
              class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-body-3 text-neutral-500"
            >
              <NuxtLink
                :to="projectWorkspaceDiscussionPath(projectSlug, item.id)"
                class="inline-flex min-h-9 items-center gap-2 rounded-sm text-primary-700 hover:text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <MessagesSquare class="h-4 w-4" aria-hidden="true" />
                {{ item.replyCount }} tanggapan
              </NuxtLink>
              <span>{{ item.participantCount }} peserta</span>
            </div>
          </div>
        </div>
      </article>

      <div
        v-if="discussionPage.page < discussionPage.totalPages"
        class="flex justify-center pt-2"
      >
        <AtomicButton
          variant="outline"
          size="sm"
          :disabled="moreListPending"
          @click="loadMoreDiscussions"
        >
          {{ moreListPending ? "Memuat…" : "Muat diskusi lainnya" }}
        </AtomicButton>
      </div>
    </div>

    <div
      v-else
      class="rounded-xl border border-neutral-200 bg-white px-5 py-10 text-center sm:py-14"
    >
      <span
        class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-50 text-primary-700"
      >
        <MessagesSquare class="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 class="mt-3 font-title-3 text-secondary-900">
        Belum ada diskusi di proyek ini
      </h2>
      <p class="mx-auto mt-1 max-w-md font-body-2 text-neutral-500">
        Simpan keputusan, pertanyaan, dan konteks penting agar seluruh anggota
        proyek dapat mengikutinya.
      </p>
      <AtomicButton
        v-if="canWrite"
        variant="primary"
        size="sm"
        class="mt-4"
        @click="openCreateDialog"
      >
        Mulai diskusi pertama
      </AtomicButton>
      <p
        v-else-if="projectInfo.data.value"
        class="mt-4 font-body-3 text-neutral-500"
      >
        Diskusi dapat dimulai setelah proyek berjalan.
      </p>
      <p
        v-else-if="projectInfo.error.value"
        class="mt-4 font-body-3 text-neutral-500"
        role="status"
      >
        Status proyek belum dapat dipastikan. Muat ulang informasi proyek
        sebelum memulai diskusi.
      </p>
    </div>

    <OrganismModal
      v-model="createDialogOpen"
      title="Mulai diskusi"
      subtitle="Bagikan konteks dan keputusan dengan anggota proyek."
      size="lg"
      :primary-label="mutationPending ? 'Menyimpan…' : 'Publikasikan diskusi'"
      :primary-loading="mutationPending"
      :primary-disabled="
        mutationPending || !draftTitle.trim() || !draftBody.trim()
      "
      secondary-label="Batal"
      @on-primary-click="submitCreate"
      @on-secondary-click="createDialogOpen = false"
      @close="createDialogOpen = false"
    >
      <form class="space-y-4" @submit.prevent="submitCreate">
        <MoleculeTicker
          v-if="mutationError"
          variant="danger"
          :message="mutationError"
        />
        <MoleculeInputField
          v-model="draftTitle"
          label="Topik"
          placeholder="Apa yang ingin dibahas?"
          required
          :maxlength="160"
        />
        <MoleculeTextarea
          v-model="draftBody"
          label="Pesan"
          placeholder="Berikan konteks dan pertanyaan…"
          :rows="6"
          :maxlength="10000"
          show-counter
          required
        />
      </form>
    </OrganismModal>

    <OrganismModal
      v-model="editDialogOpen"
      title="Edit diskusi"
      subtitle="Perubahan akan tersimpan untuk seluruh anggota proyek."
      size="lg"
      :primary-label="mutationPending ? 'Menyimpan…' : 'Simpan perubahan'"
      :primary-loading="mutationPending"
      :primary-disabled="
        mutationPending || !draftTitle.trim() || !draftBody.trim()
      "
      secondary-label="Batal"
      @on-primary-click="submitEdit"
      @on-secondary-click="editDialogOpen = false"
      @close="editDialogOpen = false"
    >
      <form class="space-y-4" @submit.prevent="submitEdit">
        <MoleculeInputField
          v-model="draftTitle"
          label="Topik"
          required
          :maxlength="160"
        />
        <MoleculeTextarea
          v-model="draftBody"
          label="Pesan"
          :rows="6"
          :maxlength="10000"
          show-counter
          required
        />
        <p
          v-if="mutationError"
          class="rounded-lg bg-danger-50 p-3 font-body-3 text-danger-800"
          role="alert"
        >
          {{ mutationError }}
        </p>
      </form>
    </OrganismModal>

    <OrganismModal
      v-model="deleteDialogOpen"
      title="Hapus diskusi?"
      subtitle="Topik dan semua isi balasannya akan dihapus dari ruang diskusi."
      size="sm"
      :primary-label="mutationPending ? 'Menghapus…' : 'Hapus diskusi'"
      :primary-loading="mutationPending"
      :primary-disabled="mutationPending"
      primary-variant="danger"
      secondary-label="Batal"
      @on-primary-click="confirmDelete"
      @on-secondary-click="deleteDialogOpen = false"
      @close="deleteDialogOpen = false"
    >
      <p class="font-body-2 text-neutral-600">
        {{ deletingDiscussion?.title ?? "Diskusi ini" }}
      </p>
      <p
        v-if="mutationError"
        class="mt-3 rounded-lg bg-danger-50 p-3 font-body-3 text-danger-800"
        role="alert"
      >
        {{ mutationError }}
      </p>
    </OrganismModal>
  </section>
</template>
