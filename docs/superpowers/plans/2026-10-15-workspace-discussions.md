# Rencana Implementasi Diskusi Workspace

> **Untuk pelaksana berbantuan agen:** Gunakan sub-skill `superpowers:subagent-driven-development` (disarankan) atau `superpowers:executing-plans` untuk mengerjakan rencana ini tahap demi tahap. Setiap langkah memakai kotak centang (`- [ ]`) agar progres dapat dilacak.

**Tujuan:** Mengganti diskusi Workspace berbasis localStorage dengan fitur persisten dan terotorisasi yang mendukung topik, balasan, edit, hapus, serta pagination stabil di Kolaboria API dan Nuxt client.

**Arsitektur:** Letakkan persistensi dan kebijakan diskusi di modul Go `workspace` yang sudah ada, menggunakan tabel PostgreSQL untuk topik dan balasan serta handler HTTP yang mengambil identitas aktor dari konteks JWT. Letakkan seluruh pembacaan dan mutasi FE di balik service/composable diskusi; route menampilkan state dari server, sedangkan localStorage hanya boleh menyimpan draft yang belum terkirim. Slug proyek digunakan untuk cakupan route dan UUID untuk identitas resource tersimpan.

**Teknologi:** Go, Gin, GORM, migrasi PostgreSQL, pengujian Go, Nuxt 4, Vue 3, TypeScript, Node test runner.

**Dokumen desain:** `kolaboria-app/docs/superpowers/specs/2026-10-15-workspace-discussions-design.md`

## Batasan Global

- Pertahankan envelope API dan `response.ErrorWithException`; exception dikirim pada `data.err_message` dan `data.trace_id` tetap tersedia.
- Semua field DTO respons API memakai tag JSON snake_case eksplisit.
- Database/API adalah sumber data otoritatif; localStorage tidak boleh menimpa data diskusi tersimpan.
- Anggota aktif proyek boleh membuat topik atau balasan; semua mutasi mensyaratkan status proyek `in_progress`.
- Edit hanya boleh dilakukan penulis. Hapus boleh dilakukan penulis atau Project Owner/Project Lead. Untuk saat ini `owner_id` adalah Project Lead otoritatif; izin task manager tidak memberi hak moderasi.
- Pencarian resource harus selalu dibatasi proyek dan tidak membocorkan keberadaan ID di proyek lain.
- Teks topik/balasan berupa plain text; batas balasan 2.000 karakter Unicode. Batas topik ditetapkan satu kali dalam kontrak FE/BE dan diuji di kedua sisi.
- Soft-delete tidak boleh mengirim teks yang sudah dihapus dan harus mempertahankan struktur balasan yang masih ada.

## Fokus Review

- Slug proyek yang salah bersama UUID diskusi valid tidak boleh membaca atau memutasi data proyek lain.
- Pengguna yang sudah dikeluarkan dari keanggotaan kehilangan akses meskipun masih memiliki route atau cache lama.
- Balasan yang masuk bersamaan dengan perubahan topik tetap tersimpan dan `last_activity_at` tetap mencerminkan mutasi terbaru.
- Penghapusan balasan utama tidak memutus relasi balasan lanjutannya; teks terhapus tidak dikirim kembali.
- POST yang gagal atau diulang tidak menghapus draft dan tidak membuat data ganda.

---

## Pemetaan File

### Backend (`kolaboria-api`)

- Buat `migrations/000012_create_workspace_discussions.up.sql` dan `.down.sql` untuk tabel topik/balasan, indeks, constraint, dan metadata soft-delete.
- Buat `internal/modules/workspace/discussion_entity.go` dan `discussion_dto.go` untuk entity persisten dan DTO snake_case.
- Perluas `internal/modules/workspace/repository.go` atau buat `discussion_repository.go` untuk persistensi transaksional dan pencarian dengan cakupan proyek.
- Perluas `internal/modules/workspace/service.go` atau buat `discussion_service.go` untuk validasi, otorisasi proyek/anggota/status, kebijakan, pagination, konsistensi mutasi, dan pemetaan respons.
- Perluas `internal/modules/workspace/handler.go` dan `routes.go` dengan aksi list/detail/create/reply/edit/delete.
- Tambahkan test service diskusi, handler, repository integration, dan migrasi sesuai kebutuhan.
- Perbarui sumber Swagger dan dokumentasi route.

### Frontend (`kolaboria-app/apps/client`)

- Buat `app/types/workspace-discussion.ts` untuk tipe DTO API dan view model.
- Perluas `app/constants/api-endpoints.ts` dan buat `app/services/workspace-discussion.service.ts` untuk request HTTP dan pembacaan envelope.
- Buat `app/composables/useWorkspaceDiscussions.ts` untuk pagination list/detail/balasan, state pending/error mutasi, dan pembaruan cache setelah sukses.
- Tambahkan `app/pages/projects/[slug]/workspace/discussions/index.vue`; pertahankan route detail dinamis dan alihkan route singular lama.
- Refactor `WorkspaceDiscussionView.vue`, `WorkspaceDiscussionDetailView.vue`, `WorkspaceDiscussionReplyItem.vue`, `WorkspaceDiscussionReplyComposer.vue`, dan `WorkspaceDiscussionDialog.vue` agar memakai state dari API dan menampilkan aksi penulis/owner.
- Perbarui `WorkspaceDiscussionDetailPage.vue`, `WorkspaceApp.vue`, `app/utils/workspace-paths.ts`, dan `app/composables/useWorkspaceController.ts` hanya untuk kebutuhan route kanonis, capability, dan dialog.
- Buat test terfokus di `apps/client/tests/` untuk pemetaan DTO, kontrak service, state composable, route, tampilan izin, perilaku draft, dan error.

## Tugas 1: Tetapkan Kontrak Teks dan Pagination Diskusi

**File:**
- Buat: `kolaboria-api/internal/modules/workspace/discussion_dto.go`
- Buat: `kolaboria-app/apps/client/app/types/workspace-discussion.ts`
- Test: test validasi Go dan `apps/client/tests/workspace-discussion-contract.test.mjs`

**Antarmuka:**
- `DiscussionListResponse`: item dan metadata cursor.
- `DiscussionTopicResponse`: field topik, penulis, jumlah balasan/peserta, timestamp, dan capability.
- `DiscussionReplyResponse`: field balasan, penulis, parent ID, timestamp, status deleted/tombstone, serta data kelompok balasan.
- `CreateDiscussionRequest`, `UpdateDiscussionRequest`, `CreateDiscussionReplyRequest`, dan `UpdateDiscussionReplyRequest` hanya memuat field yang boleh dikirim klien.
- Tetapkan batas karakter topik pada tugas ini dan pastikan nilai yang sama diuji di FE serta BE.

- [ ] **Langkah 1: Tulis test kontrak yang gagal** untuk teks wajib setelah trim, batas panjang Unicode, bentuk parent yang diizinkan, dan nama field JSON snake_case.
- [ ] **Langkah 2: Jalankan test kontrak dan pastikan gagal** karena tipe request/response belum tersedia atau batas panjang belum konsisten.
- [ ] **Langkah 3: Buat DTO dan tipe TypeScript** dengan ID UUID, timestamp RFC3339, cursor nullable, dan capability respons yang eksplisit.
- [ ] **Langkah 4: Jalankan test kontrak** dan pastikan bentuk request/response cocok.

## Tugas 2: Simpan Topik dan Balasan

**File:**
- Buat: `kolaboria-api/migrations/000012_create_workspace_discussions.up.sql`
- Buat: `kolaboria-api/migrations/000012_create_workspace_discussions.down.sql`
- Buat: `kolaboria-api/internal/modules/workspace/discussion_entity.go`
- Test: `kolaboria-api/internal/modules/workspace/discussion_repository_test.go`

**Antarmuka:**
- Tabel `workspace_discussions` dan `workspace_discussion_replies` dengan UUID, foreign key proyek, foreign key penulis, teks, timestamp, `last_activity_at`, idempotency metadata, serta metadata soft-delete.
- Balasan utama memiliki parent null. Balasan lanjutan merujuk pada balasan utama dalam topik yang sama.
- Operasi repository menerima `context.Context`, project ID yang sudah diresolusikan, ID aktor/resource, dan parameter pagination bertipe; actor ID tidak pernah diambil dari JSON request.

- [ ] **Langkah 1: Tulis test migrasi/repository yang gagal** untuk cakupan proyek, integritas relasi parent/topik, keunikan idempotency, dan indeks/urutan daftar.
- [ ] **Langkah 2: Jalankan test dan pastikan gagal** karena skema/entity/repository belum ada.
- [ ] **Langkah 3: Buat migrasi reversible dan entity GORM** dengan `idempotency_key`, `request_hash` ternormalisasi, constraint komposit jika didukung, dan indeks eksplisit untuk cursor serta traversal balasan.
- [ ] **Langkah 4: Implementasikan query repository** untuk pembacaan scoped, pagination daftar aktif, serta mutasi; perbarui `last_activity_at` dalam transaksi yang sama untuk setiap mutasi create/edit/delete yang terlihat.
- [ ] **Langkah 5: Jalankan test integration repository** pada database PostgreSQL test dan pastikan rollback terjadi jika salah satu operasi dalam transaksi gagal.

## Tugas 3: Implementasikan Kebijakan Backend dan Endpoint HTTP

**File:**
- Ubah: `kolaboria-api/internal/modules/workspace/routes.go`
- Ubah: `kolaboria-api/internal/modules/workspace/handler.go`
- Ubah: `kolaboria-api/internal/modules/workspace/service.go`
- Buat atau ubah: `kolaboria-api/internal/modules/workspace/discussion_service.go`
- Buat atau ubah: `kolaboria-api/internal/modules/workspace/discussion_repository.go`
- Test: `kolaboria-api/internal/modules/workspace/discussion_service_test.go`
- Test: `kolaboria-api/internal/modules/workspace/discussion_handler_test.go`
- Ubah: `kolaboria-api/docs/swagger.yaml` dan artefak Swagger hasil generate

**Antarmuka:**
- `GET /workspaces/:projectSlug/discussions`
- `POST /workspaces/:projectSlug/discussions`
- `GET /workspaces/:projectSlug/discussions/:discussionID`
- `PATCH` dan `DELETE /workspaces/:projectSlug/discussions/:discussionID`
- `GET` dan `POST /workspaces/:projectSlug/discussions/:discussionID/replies`
- `PATCH` dan `DELETE /workspaces/:projectSlug/discussions/:discussionID/replies/:replyID`
- Semua handler mengambil `actorID` dari konteks Gin yang sudah terautentikasi dan memakai jalur error `writeWorkspaceError`/`response.ErrorWithException` yang sudah tersedia.

- [ ] **Langkah 1: Tulis test kebijakan yang gagal** untuk anggota aktif, mantan anggota, pengguna luar, owner, task manager non-owner, penulis non-owner, status proyek, dan ID lintas proyek.
- [ ] **Langkah 2: Jalankan test dan pastikan hasilnya gagal** sebelum menambahkan handler.
- [ ] **Langkah 3: Implementasikan satu seam kebijakan otorisasi** untuk me-resolve proyek, keanggotaan aktif, owner/lead, dan capability mutasi. Petakan owner/lead ke `projects.owner_id`; jangan gunakan state task manager dari prototipe sebagai hak moderasi.
- [ ] **Langkah 4: Implementasikan validasi dan mutasi**: buat topik/balasan, edit teks milik penulis, hapus oleh penulis/owner, dan tolak balasan lanjutan di bawah balasan lanjutan lain.
- [ ] **Langkah 5: Implementasikan pembacaan cursor** dengan urutan `(last_activity_at DESC, id DESC)` untuk topik dan `(created_at ASC, id ASC)` untuk balasan utama; kembalikan jumlah tepat dan profil penulis dari server.
- [ ] **Langkah 6: Implementasikan idempotency create** melalui `Idempotency-Key` wajib dan hash input ternormalisasi; kembalikan hasil lama untuk actor/key/hash yang sama dan tolak penggunaan key yang sama dengan hash berbeda.
- [ ] **Langkah 7: Tambahkan test handler** untuk kode status, field sukses snake_case, dan envelope error yang ada, termasuk `trace_id` serta teks exception `err_message` yang tidak kosong.
- [ ] **Langkah 8: Jalankan `go test ./internal/modules/workspace/...` dan test migrasi/integration terkait**; generate ulang dan validasi Swagger.

## Tugas 4: Tambahkan Service FE dan Composable State Server

**File:**
- Ubah: `kolaboria-app/apps/client/app/constants/api-endpoints.ts`
- Buat: `kolaboria-app/apps/client/app/services/workspace-discussion.service.ts`
- Buat: `kolaboria-app/apps/client/app/composables/useWorkspaceDiscussions.ts`
- Test: `kolaboria-app/apps/client/tests/workspace-discussion-service.test.mjs`
- Test: `kolaboria-app/apps/client/tests/workspace-discussion-state.test.mjs`

**Antarmuka:**
- Method service menerima `projectSlug`, ID resource, body request, abort signal, dan cursor; pemetaan DTO snake_case ke view model dilakukan sekali.
- Composable menyediakan data daftar/detail, state loading/error, pagination, capability, dan method async create/update/delete.
- State hanya diperbarui dan draft hanya dibersihkan setelah mutasi berhasil. Error memakai helper error API yang ada dan mempertahankan `trace_id` bila tersedia.

- [ ] **Langkah 1: Tulis test service yang gagal** untuk path/verb HTTP, field payload, pembacaan envelope error, dan respons tanpa data.
- [ ] **Langkah 2: Jalankan test service dan pastikan gagal** sebelum service diimplementasikan.
- [ ] **Langkah 3: Implementasikan endpoint constants dan method service** tanpa menduplikasi normalisasi respons di setiap view.
- [ ] **Langkah 4: Tulis test composable yang gagal** untuk loading, empty/error, cursor, guard pending, pembaruan cache setelah sukses, dan pemertahanan draft setelah gagal.
- [ ] **Langkah 5: Implementasikan state composable** dengan key slug/resource dan cegah respons route lama menimpa state proyek yang baru dibuka.
- [ ] **Langkah 6: Jalankan seluruh test FE terfokus** dan pastikan request menggunakan slug, bukan ID proyek prototipe, pada kontrak yang membutuhkannya.

## Tugas 5: Jadikan Route Daftar dan Detail Konsisten

**File:**
- Buat: `kolaboria-app/apps/client/app/pages/projects/[slug]/workspace/discussions/index.vue`
- Ubah: `kolaboria-app/apps/client/app/pages/projects/[slug]/workspace/discussion.vue`
- Ubah: `kolaboria-app/apps/client/app/pages/projects/[slug]/workspace/discussions/[discussionId].vue`
- Ubah: `kolaboria-app/apps/client/app/components/workspace/WorkspaceDiscussionDetailPage.vue`
- Ubah: `kolaboria-app/apps/client/app/utils/workspace-paths.ts`
- Ubah: `kolaboria-app/apps/client/app/composables/useWorkspaceController.ts`
- Test: `kolaboria-app/apps/client/tests/workspace-discussion-routes.test.mjs`

- [ ] **Langkah 1: Tulis test route yang gagal** untuk URL daftar plural, detail berdasarkan slug route, navigasi kembali, dan redirect dari route singular.
- [ ] **Langkah 2: Pastikan test gagal** pada route daftar singular saat ini dan pembentuk URL yang menggunakan `currentProject.id` dari prototipe.
- [ ] **Langkah 3: Tambahkan route index plural dan redirect** dari route singular lama agar tautan lama tetap berfungsi.
- [ ] **Langkah 4: Perbarui helper path dan navigasi detail** agar memakai `route.params.slug`; UUID hanya dipakai sebagai ID resource diskusi.
- [ ] **Langkah 5: Jalankan test route** untuk slug/ID yang perlu URL encoding dan pastikan konteks layout Workspace tetap terpasang.

## Tugas 6: Hubungkan Halaman Daftar Diskusi

**File:**
- Ubah: `kolaboria-app/apps/client/app/components/workspace/views/WorkspaceDiscussionView.vue`
- Ubah: `kolaboria-app/apps/client/app/components/workspace/WorkspaceApp.vue`
- Ubah: `kolaboria-app/apps/client/app/composables/useWorkspaceController.ts` hanya untuk konteks API/capability yang dibutuhkan
- Test: `kolaboria-app/apps/client/tests/workspace-discussion-list.test.mjs`

- [ ] **Langkah 1: Tulis test daftar yang gagal** untuk loading, error/retry, empty state, navigasi cursor server, pembuat/jumlah/urutan yang benar, dan visibilitas aksi create berdasarkan capability.
- [ ] **Langkah 2: Pastikan test gagal** pada pagination/data localStorage saat ini.
- [ ] **Langkah 3: Hubungkan view ke composable** dan tampilkan item serta kontrol cursor dari API.
- [ ] **Langkah 4: Pertahankan visual desain saat ini** sambil menambah aksi per topik; tampilkan edit untuk penulis dan delete untuk penulis/owner.
- [ ] **Langkah 5: Hubungkan dialog create** dengan validasi server, pending state, pencegahan submit ganda, dan pemertahanan draft jika gagal.
- [ ] **Langkah 6: Jalankan test list/view/controller** dan pastikan halaman daftar tidak lagi memakai localStorage sebagai fallback data tersimpan.

## Tugas 7: Hubungkan Detail, Balasan, Edit, dan Hapus

**File:**
- Ubah: `kolaboria-app/apps/client/app/components/workspace/WorkspaceDiscussionDetailPage.vue`
- Ubah: `kolaboria-app/apps/client/app/components/workspace/views/WorkspaceDiscussionDetailView.vue`
- Ubah: `kolaboria-app/apps/client/app/components/workspace/views/WorkspaceDiscussionReplyItem.vue`
- Ubah: `kolaboria-app/apps/client/app/components/workspace/views/WorkspaceDiscussionReplyComposer.vue`
- Ubah: `kolaboria-app/apps/client/app/components/workspace/dialogs/WorkspaceDiscussionDialog.vue`
- Test: `kolaboria-app/apps/client/tests/workspace-discussion-detail.test.mjs`
- Test: `kolaboria-app/apps/client/tests/workspace-discussion-permissions.test.mjs`

- [ ] **Langkah 1: Tulis test detail yang gagal** untuk not-found, status baca-saja completed/archived, pagination balasan, pemilihan parent, integritas peserta/jumlah, dan perlindungan pergantian route.
- [ ] **Langkah 2: Tulis test hak edit/hapus yang gagal** untuk penulis, anggota lain, owner/lead, task manager non-owner, dan mantan anggota.
- [ ] **Langkah 3: Pastikan test gagal** pada detail prototipe dan handler event sinkron saat ini.
- [ ] **Langkah 4: Hubungkan detail dan balasan ke composable**; pertahankan draft sampai API sukses dan tampilkan pending/error di composer atau aksi yang sesuai.
- [ ] **Langkah 5: Tambahkan form edit** untuk judul/isi topik dan isi balasan, khusus penulis. Setelah sukses perbarui item dan timestamp; jika gagal, pertahankan draft edit.
- [ ] **Langkah 6: Tambahkan konfirmasi hapus** untuk topik dan balasan. Aksi hapus tersedia untuk penulis atau owner/lead; jangan samakan izin task manager dengan moderasi.
- [ ] **Langkah 7: Tampilkan soft-delete secara konsisten**: topik terhapus hilang dari daftar aktif dan URL langsungnya tidak tersedia; balasan terhapus menjadi tombstone sementara balasan lanjutannya tetap memiliki konteks parent.
- [ ] **Langkah 8: Jalankan test detail dan izin** termasuk pemeriksaan agar teks yang sudah dihapus tidak tersisa pada state browser.

## Tugas 8: Hilangkan Otoritas Prototipe dan Verifikasi Menyeluruh

**File:**
- Ubah: `kolaboria-app/apps/client/app/composables/useWorkspacePrototype.ts`
- Ubah: `kolaboria-app/apps/client/app/utils/workspace-prototype-state.ts`
- Ubah: fixture state Workspace dan test diskusi yang sudah ada
- Test: seluruh `kolaboria-app/apps/client/tests/workspace-discussion-*.test.mjs`

- [ ] **Langkah 1: Tulis test regresi sumber data** yang membuktikan topik server tidak digabung dengan record topik/balasan dari localStorage.
- [ ] **Langkah 2: Hapus mutasi diskusi dari jalur prototipe Workspace aktif**; pertahankan fixture demo deterministik hanya jika masih dipakai view lain.
- [ ] **Langkah 3: Pastikan tidak ada route diskusi aktif yang memanggil `startDiscussion` atau `replyToDiscussion`** dan tidak ada view list/detail yang memakai `currentProject.discussions` sebagai sumber kebenaran.
- [ ] **Langkah 4: Jalankan test workspace backend**, test diskusi FE, suite client penuh, serta typecheck/build yang tersedia; pisahkan laporan kegagalan lama yang tidak terkait.
- [ ] **Langkah 5: Verifikasi manual** create/edit/delete/reply, aksi yang ditolak oleh izin, pembatasan status proyek, persistensi setelah reload, deep link detail, redirect route, dan draft yang tetap ada ketika jaringan gagal.

## Checklist Selesai

- [ ] Migrasi API reversible dan dijalankan melalui alur migrasi lokal yang didokumentasikan.
- [ ] Test kebijakan dan handler API membuktikan keanggotaan, status, cakupan proyek, dan izin edit/hapus.
- [ ] API memakai envelope sukses/error yang berlaku; teks exception tetap dikirim pada `data.err_message` bersama `data.trace_id`.
- [ ] FE memakai data server untuk list/detail/balasan dan tidak mempercayai localStorage untuk data tersimpan.
- [ ] Semua route konsisten memakai slug proyek dan path plural `/discussions`.
- [ ] Create/edit/delete topik dan balasan dapat dipulihkan saat error dan diuji terhadap submit ganda.
- [ ] Hasil test/build/typecheck dilaporkan beserta perintah persisnya dan kegagalan lain yang tidak terkait.
