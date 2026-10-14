<template>
  <div class="mx-auto w-full pb-16">
    <!-- ─── PAGE HEADER ─── -->
    <header class="flex flex-col gap-1 sm:gap-2">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p
            class="font-label-3 text-xs font-bold uppercase tracking-wider text-primary-600"
          >
            AKTIVITAS KONTRIBUSI
          </p>
          <h1
            class="mt-1 font-title-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl"
          >
            Pengajuan Saya
          </h1>
          <p class="mt-1 font-paragraph-3 text-neutral-500 max-w-2xl leading-relaxed">
            Pantau pengajuanmu, lihat keputusan pemilik proyek, dan lanjutkan kolaborasi ketika diterima.
          </p>
        </div>

        <div class="shrink-0">
          <NuxtLink to="/projects">
            <AtomicButton
              variant="primary"
              size="sm"
              class="w-full sm:w-auto font-semibold shadow-xs"
            >
              Jelajahi Proyek
              <template #icon-right>
                <Icon name="lucide:arrow-right" class="w-4 h-4 ml-1.5" />
              </template>
            </AtomicButton>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- ─── MAIN CONTENT ─── -->
    <main class="mt-8">
      <!-- Loading State -->
      <OrganismAsyncContent
        :pending="pending"
        :ready="Boolean(applications)"
        label="Memuat pengajuan..."
      >
        <!-- Error State -->
        <MoleculeTicker
          v-if="error"
          variant="danger"
          :message="getApiErrorMessage(error)"
          :closable="false"
        />

        <template v-else-if="applications">
          <!-- ─── STATS SUMMARY (4 CARDS) ─── -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <!-- 1. Total Pengajuan -->
            <div
              class="bg-white rounded-2xl border border-neutral-200/80 p-3.5 sm:p-5 flex flex-col justify-between shadow-2xs"
            >
              <p class="font-label-3 text-xs sm:text-xs text-neutral-500 font-medium whitespace-nowrap">
                Total Pengajuan
              </p>
              <p class="font-title-1 text-2xl sm:text-3xl font-bold text-neutral-900 mt-1 sm:mt-2">
                {{ userStats.total }}
              </p>
              <p class="font-body-3 text-neutral-400 mt-1 text-xs">
                Seluruh riwayat
              </p>
            </div>

            <!-- 2. Menunggu -->
            <div
              class="bg-white rounded-2xl border border-neutral-200/80 p-3.5 sm:p-5 flex flex-col justify-between shadow-2xs"
            >
              <p class="font-label-3 text-xs sm:text-xs text-neutral-500 font-medium whitespace-nowrap">
                Menunggu
              </p>
              <p class="font-title-1 text-2xl sm:text-3xl font-bold text-accent-600 mt-1 sm:mt-2">
                {{ userStats.pending }}
              </p>
              <p class="font-body-3 text-neutral-400 mt-1 text-xs">
                Perlu keputusan
              </p>
            </div>

            <!-- 3. Diterima -->
            <div
              class="bg-white rounded-2xl border border-neutral-200/80 p-3.5 sm:p-5 flex flex-col justify-between shadow-2xs"
            >
              <p class="font-label-3 text-xs sm:text-xs text-neutral-500 font-medium whitespace-nowrap">
                Diterima
              </p>
              <p class="font-title-1 text-2xl sm:text-3xl font-bold text-success-600 mt-1 sm:mt-2">
                {{ userStats.accepted }}
              </p>
              <p class="font-body-3 text-neutral-400 mt-1 text-xs">
                Siap berkolaborasi
              </p>
            </div>

            <!-- 4. Ditolak -->
            <div
              class="bg-white rounded-2xl border border-neutral-200/80 p-3.5 sm:p-5 flex flex-col justify-between shadow-2xs"
            >
              <p class="font-label-3 text-xs sm:text-xs text-neutral-500 font-medium whitespace-nowrap">
                Ditolak
              </p>
              <p class="font-title-1 text-2xl sm:text-3xl font-bold text-neutral-900 mt-1 sm:mt-2">
                {{ userStats.rejected }}
              </p>
              <p class="font-body-3 text-neutral-400 mt-1 text-xs">
                Belum dilanjutkan
              </p>
            </div>
          </div>

          <!-- ─── RIWAYAT PENGAJUAN SECTION ─── -->
          <section aria-label="Riwayat Pengajuan">
            <div class="mb-5">
              <h2 class="font-title-2 font-bold text-neutral-900 mb-1">
                Riwayat Pengajuan
              </h2>
              <p class="font-paragraph-3 text-neutral-500">
                Semua proyek yang pernah kamu ajukan untuk berkontribusi.
              </p>
            </div>

            <div class="flex flex-col items-start gap-6 lg:flex-row lg:gap-8">
              <aside class="hidden w-64 shrink-0 space-y-5 self-start rounded-xl border border-neutral-200 bg-white p-5 lg:sticky lg:top-20 lg:block" aria-label="Filter riwayat pengajuan">
                <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div class="flex items-center gap-2">
                    <SlidersHorizontal class="h-4 w-4 text-neutral-600" aria-hidden="true" />
                    <span class="font-label-1 font-bold text-primary">Filter</span>
                    <span v-if="activeFilterCount" class="rounded-full bg-primary-50 px-2 py-0.5 font-body-3 font-semibold text-primary-700">{{ activeFilterCount }}</span>
                  </div>
                  <button v-if="activeFilterCount" type="button" class="font-body-3 text-neutral-500 transition-colors hover:text-primary-700" @click="resetFilters">Reset</button>
                </div>

                <div>
                  <h3 class="mb-3 font-label-2 font-bold text-primary">Status pengajuan</h3>
                  <div class="flex flex-col gap-2.5">
                    <AtomicCheckbox label="Semua status" :model-value="isAllStatusesSelected" @update:model-value="toggleAllStatuses" />
                    <AtomicCheckbox v-for="option in statusOptions" :key="option.value" :label="`${option.label} (${userStats[option.value]})`" :model-value="selectedStatuses.includes(option.value)" @update:model-value="() => toggleStatus(option.value)" />
                  </div>
                </div>

                <div class="border-b border-neutral-100" />

                <div>
                  <h3 class="mb-3 font-label-2 font-bold text-primary">Konteks proyek</h3>
                  <div class="flex flex-col gap-2.5">
                    <AtomicCheckbox label="Semua konteks" :model-value="isAllContextsSelected" @update:model-value="toggleAllContexts" />
                    <AtomicCheckbox v-for="context in projectContexts" :key="context" :label="context" :model-value="selectedContexts.includes(context)" @update:model-value="() => toggleContext(context)" />
                  </div>
                </div>
              </aside>

              <div class="min-w-0 w-full flex-1">
                <!-- ─── DESKTOP CONTROLS (≥ lg) ─── -->
                <div class="mb-4 hidden items-center justify-between gap-4 lg:flex">
                  <p class="font-body-2 text-secondary">Menampilkan <strong>{{ totalCount }}</strong> pengajuan</p>
                  <div class="w-48 shrink-0"><MoleculeDropdown v-model="selectedSort" :options="sortOptions" /></div>
                </div>

                <div class="mb-4 hidden lg:block">
                  <MoleculeSearchField v-model="searchInput" @search="searchQuery = $event" placeholder="Cari proyek atau posisi (minimal 3 karakter)..." aria-label="Cari proyek atau posisi" />
                </div>

                <!-- ─── MOBILE STICKY CONTROLS (< lg): Full width, sticky top-16 ─── -->
                <div class="block lg:hidden sticky top-16 z-30 -mx-4 px-4 pt-3 pb-3 bg-neutral-50/95 backdrop-blur-md border-b border-neutral-200/80 mb-5 shadow-xs">
                  <!-- 1. Search Bar di paling atas -->
                  <div class="mb-2.5">
                    <MoleculeSearchField v-model="searchInput" @search="searchQuery = $event" placeholder="Cari proyek atau posisi (minimal 3 karakter)..." aria-label="Cari proyek atau posisi" />
                  </div>

                  <!-- 2. Chips Filter & Urutkan -->
                  <div class="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-2 scrollbar-none">
                    <button type="button" class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 transition-colors hover:bg-neutral-50 active:scale-95 shadow-2xs" aria-label="Buka semua filter" @click="isMobileFilterOpen = true">
                      <Funnel class="h-4.5 w-4.5" aria-hidden="true" />
                      <span v-if="activeFilterCount" class="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary-600 px-1 font-body-3 text-white ring-2 ring-white text-[11px]">{{ activeFilterCount }}</span>
                    </button>
                    <button type="button" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors shadow-2xs active:scale-95" :class="selectedSort !== 'newest' ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'" aria-label="Urutkan pengajuan" @click="isMobileSortOpen = true">
                      <ArrowDownUp class="h-4.5 w-4.5" aria-hidden="true" />
                    </button>
                    <button type="button" class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 font-label-2 text-xs sm:text-sm transition-colors shadow-2xs active:scale-95" :class="selectedStatuses.length ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' : 'border-neutral-300 bg-white text-neutral-800'" @click="isMobileStatusFilterOpen = true">
                      {{ statusFilterLabel }}<ChevronDown class="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
                    </button>
                    <button type="button" class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 font-label-2 text-xs sm:text-sm transition-colors shadow-2xs active:scale-95" :class="selectedContexts.length ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' : 'border-neutral-300 bg-white text-neutral-800'" @click="isMobileContextFilterOpen = true">
                      {{ contextFilterLabel }}<ChevronDown class="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
                    </button>
                  </div>

                  <!-- 3. Keterangan Menampilkan xx -->
                  <p class="pt-1 font-body-2 text-secondary text-xs sm:text-sm">Menampilkan <strong class="text-neutral-900 font-semibold">{{ currentDisplayedCount }}</strong> dari <strong class="text-neutral-900 font-semibold">{{ totalCount }}</strong> pengajuan</p>
                </div>

            <!-- Cards Grid -->
            <div
              v-if="displayedApplications.length > 0"
              class="grid grid-cols-1 gap-4 sm:gap-5 mb-8"
            >
              <article
                v-for="app in displayedApplications"
                :key="app.id"
                class="bg-white rounded-2xl border border-neutral-200/90 p-5 sm:p-6 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <!-- Card Header: Monogram Avatar & Title -->
                  <div class="flex items-start gap-3.5">
                    <div
                      class="w-11 h-11 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shrink-0"
                    >
                      {{ getMonogram(app.projects?.title) }}
                    </div>

                    <div class="min-w-0 flex-1">
                      <NuxtLink
                        v-if="app.projects?.slug"
                        :to="`/projects/${app.projects.slug}`"
                        class="font-title-3 font-bold text-neutral-900 hover:text-primary-600 transition-colors line-clamp-1"
                      >
                        {{ app.projects.title }}
                      </NuxtLink>
                      <h3
                        v-else
                        class="font-title-3 font-bold text-neutral-900 truncate"
                      >
                        {{ app.projects?.title ?? 'Proyek Tidak Tersedia' }}
                      </h3>

                      <p class="font-body-3 text-neutral-500 mt-0.5 truncate">
                        Oleh {{ getAuthorName(app) }} · {{ getProjectContext(app) }}
                      </p>
                    </div>
                  </div>

                  <!-- Badges Row -->
                  <div class="flex flex-wrap items-center gap-2 mt-3.5">
                    <span
                      class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-100 text-neutral-700"
                    >
                      {{ getRoleName(app) }}
                    </span>
                    <span
                      :class="getStatusBadgeClass(app.status)"
                      class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
                    >
                      {{ getStatusLabel(app.status) }}
                    </span>
                  </div>

                  <!-- Description -->
                  <p class="font-body-2 text-neutral-600 mt-3 line-clamp-2 leading-relaxed">
                    {{ app.projects?.summary || app.expected_contribution || app.motivation }}
                  </p>

                  <!-- Status Message Callout Box -->
                  <div
                    v-if="app.status === 'pending'"
                    class="bg-accent-50/70 border border-accent-100/80 rounded-xl p-3 text-accent-900 font-body-3 mt-3.5"
                  >
                    Menunggu keputusan Project Owner
                  </div>
                  <div
                    v-else-if="app.status === 'accepted'"
                    class="bg-success-50/70 border border-success-100/80 rounded-xl p-3 text-success-900 font-body-3 mt-3.5"
                  >
                    Lamaran diterima! Siap berkolaborasi.
                  </div>
                  <div
                    v-else-if="app.status === 'rejected'"
                    class="bg-danger-50/70 border border-danger-100/80 rounded-xl p-3 text-danger-900 font-body-3 mt-3.5"
                  >
                    Lamaran belum dilanjutkan. {{ app.reviewer_note ? `Catatan: ${app.reviewer_note}` : '' }}
                  </div>
                  <div
                    v-else-if="app.status === 'withdrawn'"
                    class="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3 text-neutral-600 font-body-3 mt-3.5"
                  >
                    Pengajuan telah dibatalkan.
                  </div>
                </div>

                <!-- Footer Divider & Actions -->
                <div class="mt-4 pt-4 border-t border-neutral-100">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span class="font-body-3 text-neutral-400">
                      Diajukan {{ formatDate(app.applied_at) }}
                    </span>

                    <div class="flex items-center gap-2">
                      <AtomicButton
                        v-if="app.status === 'pending'"
                        variant="outline-danger"
                        size="sm"
                        class="font-semibold text-xs! sm:text-sm!"
                        :disabled="isWithdrawing"
                        :loading="isWithdrawing"
                        @click="handleWithdraw(app.id)"
                      >
                        Batalkan Pengajuan
                      </AtomicButton>

                      <AtomicButton
                        variant="outline"
                        size="sm"
                        class="font-semibold text-xs! sm:text-sm! text-primary-700! border-primary-200! bg-primary-50/60! hover:bg-primary-100!"
                        @click="openDetail(app)"
                      >
                        Lihat Pengajuan
                        <template #icon-right>
                          <Icon name="lucide:arrow-right" class="w-3.5 h-3.5 ml-1" />
                        </template>
                      </AtomicButton>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <!-- Mobile Endless Scrolling Sentinel & Feedback -->
            <div
              v-if="!isDesktop && totalCount > 0"
              class="w-full flex flex-col items-center py-6"
            >
              <div v-if="loadMoreError" class="flex items-center gap-3 text-sm text-danger-700">
                <span>Pengajuan berikutnya gagal dimuat.</span>
                <button type="button" class="font-semibold underline" @click="retryLoadMore">Coba lagi</button>
              </div>
              <div
                v-else-if="hasMoreMobile"
                ref="sentinelRef"
                class="flex items-center justify-center gap-2 text-sm text-neutral-500 py-3"
              >
                <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-primary-600" />
                <span class="font-body-3 text-neutral-500">Memuat pengajuan lainnya...</span>
              </div>
              <p
                v-else-if="totalCount > itemsPerPage"
                class="font-body-3 text-xs text-neutral-400 py-3 text-center"
              >
                Semua pengajuan telah ditampilkan
              </p>
            </div>

            <!-- Desktop Pagination (Hidden on mobile) -->
            <div
              v-if="totalCount > 0"
              class="hidden lg:flex justify-end pt-4 border-t border-neutral-100"
            >
              <MoleculePagination
                v-model="currentPage"
                :total-pages="totalPages"
                :total-items="totalCount"
                :per-page="itemsPerPage"
                align="end"
              />
            </div>

                <!-- Empty State -->
                <div
                  v-if="!pending && !error && totalCount === 0"
                  class="py-16 flex flex-col items-center justify-center text-center px-4 bg-white border border-neutral-200/80 rounded-2xl shadow-2xs"
                >
                  <OrganismEmptyState
                    icon="document"
                    title="Belum ada pengajuan"
                    :description="
                      selectedStatuses.length === 0 && selectedContexts.length === 0 && !searchQuery
                        ? 'Tampaknya kamu belum mengirimkan pengajuan ke proyek manapun. Mari jelajahi proyek baru!'
                        : 'Tidak ada pengajuan yang cocok. Coba ubah kata kunci atau filter yang dipilih.'
                    "
                    action="Jelajahi Proyek"
                    @action="navigateTo('/projects')"
                  />
                </div>
              </div>
            </div>

            <OrganismBottomSheet v-model="isMobileSortOpen" title="Urutkan Pengajuan" subtitle="Pilih urutan daftar pengajuan" primary-label="Terapkan" secondary-label="Reset" @primary="isMobileSortOpen = false" @secondary="selectedSort = 'newest'">
              <div class="flex flex-col gap-4 py-2">
                <AtomicRadio v-for="option in sortOptions" :key="option.value" v-model="selectedSort" :value="option.value" :label="option.label" name="my-applications-sort-option" />
              </div>
            </OrganismBottomSheet>

            <OrganismBottomSheet v-model="isMobileFilterOpen" title="Filter Pengajuan" subtitle="Pilih status dan konteks proyek" primary-label="Terapkan" secondary-label="Reset Semua" @primary="isMobileFilterOpen = false" @secondary="resetFilters">
              <div class="space-y-6 py-2">
                <div>
                  <h3 class="mb-3 font-label-1 font-bold text-primary">Status pengajuan</h3>
                  <div class="flex flex-col gap-3">
                    <AtomicCheckbox label="Semua status" :model-value="isAllStatusesSelected" @update:model-value="toggleAllStatuses" />
                    <AtomicCheckbox v-for="option in statusOptions" :key="option.value" :label="`${option.label} (${userStats[option.value]})`" :model-value="selectedStatuses.includes(option.value)" @update:model-value="() => toggleStatus(option.value)" />
                  </div>
                </div>
                <div class="border-b border-neutral-100" />
                <div>
                  <h3 class="mb-3 font-label-1 font-bold text-primary">Konteks proyek</h3>
                  <div class="flex flex-col gap-3">
                    <AtomicCheckbox label="Semua konteks" :model-value="isAllContextsSelected" @update:model-value="toggleAllContexts" />
                    <AtomicCheckbox v-for="context in projectContexts" :key="context" :label="context" :model-value="selectedContexts.includes(context)" @update:model-value="() => toggleContext(context)" />
                  </div>
                </div>
              </div>
            </OrganismBottomSheet>

            <OrganismBottomSheet v-model="isMobileStatusFilterOpen" title="Status Pengajuan" subtitle="Pilih satu atau beberapa status" primary-label="Terapkan" secondary-label="Reset" @primary="isMobileStatusFilterOpen = false" @secondary="toggleAllStatuses(true)">
              <div class="flex flex-col gap-3.5 py-2">
                <AtomicCheckbox label="Semua status" :model-value="isAllStatusesSelected" @update:model-value="toggleAllStatuses" />
                <AtomicCheckbox v-for="option in statusOptions" :key="option.value" :label="`${option.label} (${userStats[option.value]})`" :model-value="selectedStatuses.includes(option.value)" @update:model-value="() => toggleStatus(option.value)" />
              </div>
            </OrganismBottomSheet>

            <OrganismBottomSheet v-model="isMobileContextFilterOpen" title="Konteks Proyek" subtitle="Pilih konteks proyek yang pernah diajukan" primary-label="Terapkan" secondary-label="Reset" @primary="isMobileContextFilterOpen = false" @secondary="toggleAllContexts(true)">
              <div class="flex flex-col gap-3.5 py-2">
                <AtomicCheckbox label="Semua konteks" :model-value="isAllContextsSelected" @update:model-value="toggleAllContexts" />
                <AtomicCheckbox v-for="context in projectContexts" :key="context" :label="context" :model-value="selectedContexts.includes(context)" @update:model-value="() => toggleContext(context)" />
              </div>
            </OrganismBottomSheet>
          </section>
        </template>
      </OrganismAsyncContent>
    </main>

    <!-- ─── DETAIL MODAL / BOTTOM SHEET ─── -->
    <OrganismModal
      v-model="isDetailModalOpen"
      title="Detail Pengajuan"
      :subtitle="selectedApp?.applied_at ? `Diajukan ${formatDate(selectedApp.applied_at)}` : ''"
      size="lg"
      @close="closeDetail"
    >
      <div v-if="selectedApp" class="space-y-5">
        <!-- Project Summary Row -->
        <div class="flex items-start gap-3.5">
          <div
            class="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 font-bold flex items-center justify-center text-base shrink-0"
          >
            {{ getMonogram(selectedApp.projects?.title) }}
          </div>

          <div class="min-w-0 flex-1">
            <h3 class="font-title-2 font-bold text-neutral-900 leading-snug">
              {{ selectedApp.projects?.title }}
            </h3>
            <p class="font-body-3 text-neutral-500 mt-0.5">
              Oleh {{ getAuthorName(selectedApp) }} · {{ getProjectContext(selectedApp) }}
            </p>
            <div class="mt-2">
              <span
                :class="getStatusBadgeClass(selectedApp.status)"
                class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold"
              >
                {{ getStatusLabel(selectedApp.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Banner Callout Box -->
        <div
          v-if="selectedApp.status === 'pending'"
          class="bg-accent-50/70 border border-accent-100/80 rounded-xl p-3.5 text-accent-900 font-body-3 leading-relaxed"
        >
          Pengajuanmu telah dikirim dan masih menunggu keputusan Project Owner.
        </div>
        <div
          v-else-if="selectedApp.status === 'accepted'"
          class="bg-success-50/70 border border-success-100/80 rounded-xl p-3.5 text-success-900 font-body-3 leading-relaxed"
        >
          Pengajuanmu telah diterima! Kamu siap berkolaborasi dalam proyek ini.
        </div>
        <div
          v-else-if="selectedApp.status === 'rejected'"
          class="bg-danger-50/70 border border-danger-100/80 rounded-xl p-3.5 text-danger-900 font-body-3 leading-relaxed"
        >
          Pengajuanmu belum dapat dilanjutkan oleh Project Owner saat ini.
        </div>
        <div
          v-else-if="selectedApp.status === 'withdrawn'"
          class="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3.5 text-neutral-600 font-body-3 leading-relaxed"
        >
          Pengajuan ini telah kamu batalkan.
        </div>

        <!-- Metadata 2x2 Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div>
            <p class="font-body-3 text-neutral-400">Posisi yang Diajukan</p>
            <p class="font-title-3 font-bold text-neutral-900 mt-0.5">
              {{ getRoleName(selectedApp) }}
            </p>
          </div>
          <div>
            <p class="font-body-3 text-neutral-400">Ketersediaan</p>
            <p class="font-title-3 font-bold text-neutral-900 mt-0.5">
              {{ getAvailabilityLabel(selectedApp.availability) }}
            </p>
          </div>
          <div>
            <p class="font-body-3 text-neutral-400">Tanggal Pengajuan</p>
            <p class="font-title-3 font-bold text-neutral-900 mt-0.5">
              {{ formatDate(selectedApp.applied_at) }}
            </p>
          </div>
          <div>
            <p class="font-body-3 text-neutral-400">Tanggal Keputusan</p>
            <p class="font-title-3 font-bold text-neutral-900 mt-0.5">
              {{ selectedApp.reviewed_at ? formatDate(selectedApp.reviewed_at) : '—' }}
            </p>
          </div>
        </div>

        <hr class="border-neutral-100" />

        <!-- Motivasi yang Kamu Kirim -->
        <div>
          <h4 class="font-label-1 font-bold text-neutral-900 mb-1.5">
            Motivasi yang Kamu Kirim
          </h4>
          <p class="font-body-2 text-neutral-600 leading-relaxed whitespace-pre-line">
            {{ selectedApp.motivation }}
          </p>
        </div>

        <hr class="border-neutral-100" />

        <!-- Kontribusi yang Kamu Tawarkan -->
        <div>
          <h4 class="font-label-1 font-bold text-neutral-900 mb-1.5">
            Kontribusi yang Kamu Tawarkan
          </h4>
          <p class="font-body-2 text-neutral-600 leading-relaxed whitespace-pre-line">
            {{ selectedApp.expected_contribution || 'Tidak dicantumkan' }}
          </p>
        </div>

        <hr class="border-neutral-100" />

        <!-- Portofolio yang Dilampirkan -->
        <div>
          <h4 class="font-label-1 font-bold text-neutral-900 mb-2">
            Portofolio yang Dilampirkan
          </h4>
          <div
            v-if="selectedApp.portfolio_links && selectedApp.portfolio_links.length > 0"
            class="space-y-2"
          >
            <div
              v-for="link in selectedApp.portfolio_links"
              :key="link"
              class="border border-neutral-200 rounded-xl p-3 bg-white hover:border-primary-300 transition-colors"
            >
              <a
                :href="link"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary-600 font-body-2 hover:underline truncate flex items-center justify-between"
              >
                <span class="truncate">{{ link }}</span>
                <Icon name="lucide:arrow-up-right" class="w-4 h-4 shrink-0 ml-1.5" />
              </a>
            </div>
          </div>
          <p v-else class="font-body-2 text-neutral-400 italic">
            Tidak ada tautan portofolio yang dilampirkan.
          </p>
        </div>
      </div>

      <!-- Modal Footer Actions -->
      <template #footer>
        <div class="flex items-center justify-between w-full">
          <div>
            <AtomicButton
              v-if="selectedApp?.status === 'pending'"
              variant="outline-danger"
              size="sm"
              :disabled="isWithdrawing"
              :loading="isWithdrawing"
              @click="handleWithdrawFromModal"
            >
              Batalkan Pengajuan
            </AtomicButton>
          </div>

          <div>
            <NuxtLink
              v-if="selectedApp?.projects?.slug"
              :to="`/projects/${selectedApp.projects.slug}`"
            >
              <AtomicButton
                variant="outline"
                size="sm"
                class="bg-primary-50! text-primary-700! border-primary-200! hover:bg-primary-100!"
              >
                Lihat Proyek
              </AtomicButton>
            </NuxtLink>
          </div>
        </div>
      </template>
    </OrganismModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ArrowDownUp, ChevronDown, Funnel, SlidersHorizontal } from '@lucide/vue'
import { useInfiniteScroll } from '~/composables/useInfiniteScroll'
import { useMyApplications } from '~/composables/useMyApplications'
import { ApplicationService } from '~/services/application.service'
import { getApiErrorMessage } from '../../utils/error'
import type { ApplicationOrigin, ApplicationStatus } from '~/types/application'
import { toApplicationDetailCardView, toMyApplicationCardView, type MyApplicationCardView } from '~/utils/application-presentation'

definePageMeta({ layout: 'home', middleware: ['auth', 'onboarding-guard'] })
useHead({ title: 'Pengajuan Saya — Kolaboria' })

const { user } = useAuth()
const toast = useToast()
const { show: showPopup } = usePopup()
const selectedStatuses = ref<ApplicationStatus[]>([])
const searchQuery = ref('')
const searchInput = ref('')
const selectedContexts = ref<string[]>([])
const selectedSort = ref<'newest' | 'oldest'>('newest')
const currentPage = ref(1)
const itemsPerPage = 6
const isMobileFilterOpen = ref(false)
const isMobileSortOpen = ref(false)
const isMobileStatusFilterOpen = ref(false)
const isMobileContextFilterOpen = ref(false)
const isDesktop = ref(false)
const mobileDisplayCount = ref(itemsPerPage)
const isMobileLoadingMore = ref(false)
const accountId = computed(() => user.value?.id ?? null)

const originByLabel: Record<string, ApplicationOrigin> = {
  'Proyek pribadi': 'personal',
  Komunitas: 'community',
  Eksperimen: 'experiment',
  'Proyek client': 'client'
}
const query = computed(() => ({
  limit: itemsPerPage,
  search: searchQuery.value || undefined,
  statuses: selectedStatuses.value.length ? selectedStatuses.value : undefined,
  origins: selectedContexts.value.length
    ? selectedContexts.value.map((label) => originByLabel[label]).filter((origin): origin is ApplicationOrigin => Boolean(origin))
    : undefined,
  sort: selectedSort.value
}))
const state = useMyApplications(accountId, query, ApplicationService)
const applications = computed(() => state.items.value.map(toMyApplicationCardView))
const pending = state.pending
const error = state.error
const loadMoreError = state.loadMoreError
const totalCount = computed(() => state.meta.value?.total ?? 0)
const totalPages = computed(() => state.meta.value?.total_pages ?? 1)
const hasMoreMobile = state.hasMore
const isWithdrawing = state.submitting
const selectedApp = ref<MyApplicationCardView | null>(null)
const isDetailModalOpen = ref(false)

const userStats = computed(() => state.summary.value?.stats ?? {
  total: 0, pending: 0, accepted: 0, rejected: 0, withdrawn: 0
})
const statusOptions: { label: string; value: ApplicationStatus }[] = [
  { label: 'Menunggu', value: 'pending' },
  { label: 'Diterima', value: 'accepted' },
  { label: 'Ditolak', value: 'rejected' },
  { label: 'Dibatalkan', value: 'withdrawn' }
]
const projectContextLabels: Record<string, string> = {
  personal: 'Proyek pribadi', community: 'Komunitas',
  experiment: 'Eksperimen', client: 'Proyek client'
}
const projectContexts = Object.keys(originByLabel)
const sortOptions = [
  { label: 'Terbaru', value: 'newest' },
  { label: 'Terlama', value: 'oldest' }
]
const isAllStatusesSelected = computed(() => selectedStatuses.value.length === 0)
const isAllContextsSelected = computed(() => selectedContexts.value.length === 0)
const activeFilterCount = computed(() => selectedStatuses.value.length + selectedContexts.value.length)
const toggleAllStatuses = (checked: boolean) => { if (checked) selectedStatuses.value = [] }
const toggleStatus = (status: ApplicationStatus) => {
  selectedStatuses.value = selectedStatuses.value.includes(status)
    ? selectedStatuses.value.filter((item) => item !== status)
    : [...selectedStatuses.value, status]
}
const toggleAllContexts = (checked: boolean) => { if (checked) selectedContexts.value = [] }
const toggleContext = (context: string) => {
  selectedContexts.value = selectedContexts.value.includes(context)
    ? selectedContexts.value.filter((item) => item !== context)
    : [...selectedContexts.value, context]
}
const resetFilters = () => {
  selectedStatuses.value = []
  selectedContexts.value = []
  searchQuery.value = ''
  searchInput.value = ''
  selectedSort.value = 'newest'
  currentPage.value = 1
  mobileDisplayCount.value = itemsPerPage
}
const statusFilterLabel = computed(() => {
  if (!selectedStatuses.value.length) return 'Status'
  if (selectedStatuses.value.length > 1) return `${selectedStatuses.value.length} Status`
  return statusOptions.find((option) => option.value === selectedStatuses.value[0])?.label || 'Status'
})
const contextFilterLabel = computed(() => {
  if (!selectedContexts.value.length) return 'Konteks'
  if (selectedContexts.value.length > 1) return `${selectedContexts.value.length} Konteks`
  return selectedContexts.value[0]
})

const getMonogram = (title?: string) => {
  if (!title) return 'PP'
  const words = title.trim().split(/\s+/)
  return words.length > 1
    ? ((words[0] ?? '').charAt(0) + (words[1] ?? '').charAt(0)).toUpperCase()
    : title.slice(0, 2).toUpperCase()
}
const getAuthorName = (app?: MyApplicationCardView | null) =>
  app?.profiles?.full_name || app?.profiles?.username || 'Project Owner'
const getProjectContext = (app?: MyApplicationCardView | null) => {
  const context = app?.project.origin
  return context ? projectContextLabels[context] || context : 'Proyek pribadi'
}
const getRoleName = (app?: MyApplicationCardView | null) =>
  app?.project_role?.custom_title || app?.project_role?.contribution_role?.name || 'Kontributor'
const getAvailabilityLabel = (availability?: string) => ({
  part_time: 'Paruh waktu', full_time: 'Penuh waktu',
  weekends_only: 'Akhir pekan', flexible: 'Fleksibel'
}[availability || ''] || 'Fleksibel')
const getStatusLabel = (status?: string) => ({
  pending: 'Menunggu', accepted: 'Diterima', rejected: 'Ditolak', withdrawn: 'Dibatalkan'
}[status || ''] || status || '—')
const getStatusBadgeClass = (status?: string) => ({
  pending: 'bg-accent-50 text-accent-700 border border-accent-200/60',
  accepted: 'bg-success-50 text-success-700 border border-success-200/60',
  rejected: 'bg-danger-50 text-danger-700 border border-danger-200/60',
  withdrawn: 'bg-neutral-100 text-neutral-600 border border-neutral-200/60'
}[status || ''] || 'bg-neutral-100 text-neutral-600 border border-neutral-200/60')
const formatDate = (dateString?: string | null) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

let mediaQuery: MediaQueryList | null = null
const handleMediaChange = (event: MediaQueryListEvent | MediaQueryList) => { isDesktop.value = event.matches }
onMounted(() => {
  if (typeof window === 'undefined') return
  mediaQuery = window.matchMedia('(min-width: 1024px)')
  isDesktop.value = mediaQuery.matches
  mediaQuery.addEventListener('change', handleBreakpointChange)
})
onUnmounted(() => mediaQuery?.removeEventListener('change', handleBreakpointChange))
const handleBreakpointChange = (event: MediaQueryListEvent | MediaQueryList) => {
  handleMediaChange(event)
  currentPage.value = 1
  mobileDisplayCount.value = itemsPerPage
  void state.refresh()
}

const loadMoreMobile = async () => {
  if (isMobileLoadingMore.value || !hasMoreMobile.value) return
  isMobileLoadingMore.value = true
  await state.loadMore()
  mobileDisplayCount.value += itemsPerPage
  isMobileLoadingMore.value = false
}
const { sentinelRef } = useInfiniteScroll({
  onLoadMore: loadMoreMobile, hasMore: hasMoreMobile,
  disabled: isDesktop, distance: '200px'
})
const retryLoadMore = () => state.loadMore()
watch(currentPage, (page, previous) => {
  if (page !== previous) void state.loadPage(page)
  if (isDesktop.value && typeof window !== 'undefined') window.scrollTo({ top: 180, behavior: 'smooth' })
})
watch([selectedStatuses, selectedContexts, searchQuery, selectedSort], () => {
  currentPage.value = 1
  mobileDisplayCount.value = itemsPerPage
}, { deep: true })
const displayedApplications = applications
const currentDisplayedCount = computed(() => Math.min(
  isDesktop.value ? currentPage.value * itemsPerPage : mobileDisplayCount.value,
  totalCount.value
))

const openDetail = async (app: MyApplicationCardView) => {
  selectedApp.value = app
  isDetailModalOpen.value = true
  await state.openDetail(app.id)
  if (state.detail.value?.id === app.id) selectedApp.value = toApplicationDetailCardView(state.detail.value)
}
const closeDetail = () => {
  isDetailModalOpen.value = false
  selectedApp.value = null
  state.closeDetail()
}
const handleWithdrawFromModal = () => {
  if (!selectedApp.value) return
  const id = selectedApp.value.id
  closeDetail()
  handleWithdraw(id)
}
const handleWithdraw = (applicationId: string) => {
  showPopup({
    title: 'Batalkan Pengajuan?',
    description: 'Apakah kamu yakin ingin membatalkan pengajuan ini? Tindakan ini tidak dapat dibatalkan.',
    type: 'danger',
    positiveLabel: 'Ya, Batalkan',
    negativeLabel: 'Kembali',
    onPositive: async () => {
      try {
        await state.withdraw(applicationId)
        currentPage.value = 1
        closeDetail()
        toast.success('Pengajuan berhasil dibatalkan.')
      } catch (failure: unknown) {
        toast.error(getApiErrorMessage(failure, 'Gagal membatalkan pengajuan.'))
      }
    }
  })
}
</script>

<style scoped>
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
