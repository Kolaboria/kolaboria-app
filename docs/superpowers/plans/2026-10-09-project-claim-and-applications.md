# Rencana Implementasi Claim Project Lead dan Lamaran Kontributor

> **Referensi historis untuk scope applicants/applications:** bagian pengelolaan pelamar, lamaran, persistence, kontrak API, dan integrasi client yang tumpang tindih telah digantikan oleh [rencana terbaru 13 Oktober 2026](../../../../kolaboria-api/docs/superpowers/plans/2026-10-13-applicants-api-and-client.md) dan [requirement r2](../../../../kolaboria-api/docs/applicants-api-requirements.md). Jangan menjalankan kembali pembuatan migration 000010/Apply atau menambahkan generic project capabilities dari rencana ini. Detail claim adalah konteks historis untuk pekerjaan dependency terpisah dan harus diselaraskan dengan keputusan terbaru sebelum dieksekusi.

> **Untuk pelaksana agent:** Setelah rencana dan keputusan produknya disetujui, gunakan `superpowers:executing-plans` atau `superpowers:subagent-driven-development`. Setiap langkah memakai kotak centang agar kemajuan dapat ditinjau. Rencana ini tidak mengizinkan commit, push, atau deployment.

**Tujuan:** Menghapus simulasi detail proyek dan menyediakan alur tersimpan untuk claim Project Lead, pengajuan/peninjauan lamaran, serta pesan dan CTA yang memberi langkah berikutnya tanpa tombol bisnis yang terus-menerus nonaktif.

**Arsitektur:** API Go menjadi sumber kebenaran untuk identitas, claim, status lamaran, cooldown, kapasitas, dan capability. Migrasi PostgreSQL menyimpan riwayat lamaran; operasi yang dapat bersaing mengunci data proyek/peran dalam transaksi. Frontend Nuxt membaca keadaan viewer dari detail proyek dan memakai endpoint API untuk setiap aksi.

**Teknologi:** Go, Gin, GORM, PostgreSQL, migrasi SQL; Nuxt 4, Vue 3, TypeScript, komponen design system yang sudah ada; test Go, Node bawaan, dan skrip verifikasi migrasi yang tersedia.

**Spesifikasi:** [`docs/superpowers/specs/2026-10-09-project-claim-and-applications-design.md`](../specs/2026-10-09-project-claim-and-applications-design.md)

## Keputusan yang harus dikunci sebelum kode

Spesifikasi memuat dua aturan detail yang masih perlu dikonfirmasi sebelum mutasi API. Keputusan lain di bawah ini sudah dikonfirmasi pengguna dan harus diperlakukan sebagai persyaratan:

| Aturan | Usulan di spesifikasi |
| --- | --- |
| Lamaran yang ditarik | Dapat diajukan ulang langsung bila proyek masih terbuka. |
| Status setelah penerimaan | Membership dan kapasitas berubah, tetapi proyek tetap `open`; tidak otomatis menjadi `in_progress`. |

Keputusan yang sudah dikonfirmasi: claim langsung dengan prinsip first-valid-claim-wins; penolakan memulai cooldown tepat 3×24 jam yang hanya membatasi pengguna tersebut pada proyek yang sama (termasuk role lain di proyek itu); pengguna tetap boleh melamar ke proyek lain dan pelamar lain tetap boleh melamar ke proyek tersebut. Inisiator organisasi boleh claim proyek organisasi yang belum memiliki owner hanya jika ia memenuhi syarat talent dan bukan pembuat/inisiator proyek tersebut. Proyek tanpa owner tetap tidak menerima lamaran kontributor sampai claim berhasil.

## Batas global

- Jangan membaca query simulasi atau memakai fixture lamaran/claim pada alur detail proyek nyata.
- API memakai envelope `{ status, message, data }`; semua nama properti JSON memakai `snake_case`.
- API memeriksa sesi, status akun, tipe akun, verifikasi, kepemilikan, status proyek, kuota, dan cooldown saat setiap mutasi; capability frontend bukan kontrol keamanan.
- Claim memakai prinsip first-valid-claim-wins dan harus aman terhadap dua request bersamaan.
- Penolakan lamaran memulai cooldown 3 hari berdasarkan waktu server.
- Penerimaan lamaran membuat membership kontributor dan memakai satu slot role dalam transaksi yang sama.
- Jangan membuat aplikasi, komponen design system, palet warna, atau dependency baru bila yang sudah ada mencukupi.
- Gunakan aksi login/verifikasi saat pengguna membutuhkan langkah itu; hindari CTA yang tetap nonaktif karena belum login atau belum terverifikasi.
- Tetap di scope claim, lamaran, dan CTA detail. Jangan menambahkan Workspace, notifikasi, start/complete/archive proyek, atau rekam pengalaman.
- Jalankan migrasi dan verifikasi basis data hanya pada target terisolasi yang diizinkan oleh skrip `kolaboria-api/scripts/verify-project-editor.ps1`; jangan mengarahkannya ke basis data aplikasi.
- Jangan melakukan commit, push, reset, atau deployment tanpa otorisasi terpisah.

## Fokus review

| Risiko/masukan | Uji yang mengikatnya |
| --- | --- |
| Dua talent mengklaim proyek yang sama pada saat bersamaan | Uji service/integrasi claim memastikan tepat satu owner dan satu hasil sukses. |
| Dua lamaran diterima untuk slot role terakhir | Uji transaksi penerimaan memastikan kuota tidak pernah terlampaui. |
| Cooldown per pengguna dan proyek selama tepat 3×24 jam | Uji sebelum, tepat pada, dan sesudah `retry_after`; pengguna yang sama diblokir lintas role hanya pada proyek itu, tetapi dapat melamar proyek lain; pengguna lain tetap dapat melamar ke proyek yang sama. |
| Inisiator organisasi mencoba claim proyeknya sendiri | Uji penolakan ketika actor sama dengan `created_by_user_id`/inisiator, serta keberhasilan talent eligible lain pada proyek organisasi tanpa owner. |
| Owner organisasi yang mengklaim bukan pembuat proyek membuka halaman pelamar | Uji capability dan otorisasi halaman memakai owner aktual, bukan `creator_id`. |
| Pengunjung atau talent belum terverifikasi melihat CTA yang tidak dapat dilanjutkan | Uji mapping CTA memastikan ada jalur masuk/verifikasi dengan kembali ke detail proyek. |

---

## Pemetaan file

### API — `kolaboria-api`

| File | Perubahan yang direncanakan |
| --- | --- |
| `migrations/000010_create_project_applications.up.sql` dan `.down.sql` | Tabel, constraint, indeks, dan rollback untuk riwayat lamaran. |
| `internal/modules/project/entity.go` | Entitas lamaran dan ringkasan viewer/detail yang dibutuhkan. |
| `internal/modules/project/dto.go` | DTO request/response claim, lamaran, applicant, viewer state, dan error/domain results. |
| `internal/modules/project/repository.go` | Kontrak transaksi untuk mengunci proyek/role/aplikasi, menyimpan lamaran, dan membuat membership. |
| `internal/modules/project/service.go` | Aturan claim, apply, withdraw, review, cooldown, kapasitas, dan eligibility. |
| `internal/modules/project/read_repository.go`, `read_service.go`, `mapper.go` | Memuat application state untuk viewer, jumlah pending privat bagi owner, dan capability akurat. |
| `internal/modules/project/handler.go`, `routes.go` | Mendaftarkan dan menangani endpoint pada kontrak spesifikasi. |
| `internal/modules/project/service_test.go`, `read_service_test.go`, `dto_test.go` | Uji aturan transaksi, akses, kontrak dan state baca. |
| `scripts/verify-project-editor.ps1` dan migration tests | Memverifikasi migrasi `000010` naik/turun/naik pada database tes terisolasi. |
| `docs/project-editor.md`, anotasi handler, `docs/` hasil Swagger | Mendokumentasikan endpoint, akses, payload, error, dan response baru. |

### Frontend — `kolaboria-app/apps/client`

| File | Perubahan yang direncanakan |
| --- | --- |
| `app/types/project.ts`, `app/types/api.ts` | Tipe viewer application, claim/application request-response, dan error terstruktur tanpa `any` baru. |
| `app/constants/api-endpoints.ts` | Endpoint claim dan konsolidasi route lamaran yang cocok dengan API. |
| `app/services/project.service.ts`, `app/services/application.service.ts` | Panggilan claim/apply/list/review/withdraw dengan tipe kontrak. |
| `app/composables/useProjects.ts` | Perintah dan refresh data untuk claim/aplikasi serta pemetaan error aman. |
| `app/utils/project-presentation.ts` | Mapping DTO detail ke view model, termasuk viewer state dan pending count. |
| `app/pages/projects/[slug]/index.vue` | Menghapus simulasi; menampilkan status dan CTA berdasarkan response/capability nyata. |
| `app/components/project/ApplyModal.vue` | Menghapus bypass simulasi; submit dan validasi terhubung ke API. |
| `app/components/project/ClaimProjectLeadModal.vue` (baru, jika komponen modal existing tidak cocok) | Konfirmasi claim, status submit, konflik claim, dan feedback ringkas. Sebelum membuat file, pastikan `OrganismModal` existing tidak dapat menanggung perilaku ini. |
| `app/pages/projects/[slug]/applicants.vue` | Akses berdasar capability owner/API, baca daftar dan review lamaran dengan error/refresh konsisten. |
| `app/pages/projects/my-applications.vue` | Menampilkan status dan jalur withdrawal serta cooldown dari response API. |
| `app/utils/project-detail-simulation.ts` | Hapus fixture/selector simulasi bila tidak dipakai halaman lain. |
| `tests/project-detail-simulation.test.mjs` | Hapus test simulasi dan ganti dengan test mapping CTA serta copy state nyata. |
| `tests/project-detail-actions.test.mjs`, `tests/project-application-flow.test.mjs` (baru) | Uji navigasi login/verifikasi, CTA claim/apply, cooldown, status owner/pelamar, dan error konflik. |

---

## Task 1 — Kunci aturan spesifikasi dan skema lamaran

**Berkas:** spesifikasi; migrasi baru `kolaboria-api/migrations/000010_create_project_applications.{up,down}.sql`; entitas dan DTO module project.

**Antarmuka keluaran:** `ProjectApplication` menyimpan project, role, applicant user, isi pengajuan, availability, status, reviewer, dan timestamp; response tetap snake_case.

- [ ] **Langkah 1: Kunci dua aturan yang masih usulan pada spesifikasi.** Konfirmasi re-apply langsung setelah withdraw dan status proyek setelah accept. Pertahankan keputusan yang sudah pasti: cooldown berlaku 72 jam per pasangan pengguna/proyek (lintas role), serta inisiator tidak boleh claim proyek yang ia buat/inisiasi sendiri.
- [ ] **Langkah 2: Tambahkan uji skema/migrasi yang gagal untuk constraint lamaran.** Pastikan status hanya `pending|accepted|rejected|withdrawn`, role dan proyek memiliki foreign key konsisten, `reviewed_at` wajib untuk status hasil review, serta satu pending/accepted per applicant/project.
- [ ] **Langkah 3: Tambahkan migrasi `000010` dan entitas `ProjectApplication`.** Simpan `portfolio_links` dalam bentuk yang konsisten dengan PostgreSQL, timestamp UTC, reviewer note terbatas, dan indeks untuk daftar project/applicant serta pencarian riwayat penolakan yang dikelompokkan per pasangan applicant/project.
- [ ] **Langkah 4: Jalankan tes migrasi pada database tes terisolasi.** Verifikasi up → down `000010` → up `000010`; pastikan migrasi `000009` dan skema sebelumnya tetap ada.
- [ ] **Langkah 5: Jalankan `go test ./internal/modules/project/...`.** Hasil yang diharapkan: test entitas/DTO dan kontrak migration yang ditambahkan lulus.

## Task 2 — Claim Project Lead yang atomik

**Berkas:** `internal/modules/project/{entity.go,dto.go,repository.go,service.go,handler.go,routes.go,service_test.go}`.

**Antarmuka:** `ClaimProject(ctx context.Context, actorID, projectID uuid.UUID) (*ProjectDetailResponse, error)` dan `POST /api/v1/projects/:id/claim` tanpa body.

- [ ] **Langkah 1: Tulis test service untuk claim valid dan semua penolakan.** Uji akun bukan talent, belum onboarded, belum verified, project bukan publik/organization initiated/`awaiting_owner`, project sudah punya owner, actor adalah `created_by_user_id`/inisiator project, serta user lain yang memenuhi syarat pada proyek organisasi yang sama.
- [ ] **Langkah 2: Jalankan test claim baru dan pastikan gagal pada aturan/operasi yang belum tersedia.** Gunakan `go test ./internal/modules/project -run Claim -count=1`.
- [ ] **Langkah 3: Tambahkan operasi repository transaksional yang mengunci row proyek.** Dalam satu transaksi, baca eligibility terbaru, set `owner_id`, pindahkan `awaiting_owner` ke `open`, naikkan `version`, serta buat membership `owner` aktif.
- [ ] **Langkah 4: Implementasikan service dan endpoint claim.** Validasi UUID dan identitas sebelum masuk service; tetapkan konflik claim bersamaan sebagai error stabil; gunakan response/error helper API existing.
- [ ] **Langkah 5: Tambahkan uji race/conflict berbasis repository dan handler.** Buktikan claim hanya menang sekali, owner membership tidak ganda, dan response envelope/status konsisten.
- [ ] **Langkah 6: Jalankan `go test ./internal/modules/project/...`.** Hasil yang diharapkan: seluruh unit test project lulus.

## Task 3 — Pengajuan, cooldown, dan state pemilik/pelamar pada detail

**Berkas:** `internal/modules/project/{entity.go,dto.go,repository.go,service.go,read_repository.go,read_service.go,mapper.go,handler.go,routes.go,service_test.go,read_service_test.go}`.

**Antarmuka:** `ApplyToProject(ctx, actorID uuid.UUID, projectID uuid.UUID, request ApplyProjectRequest)`; `ProjectDetailResponse` memuat `viewer_application` opsional dan pending count privat untuk owner.

- [ ] **Langkah 1: Tulis test gagal untuk pengajuan valid dan syarat penolakan.** Uji belum punya owner, project bukan `open`, role bukan milik project, role penuh/archived, owner/member mendaftar, active duplicate, profil belum eligible, dan masa cooldown.
- [ ] **Langkah 2: Pastikan batas cooldown 3×24 jam dengan clock terkontrol.** Uji waktu sebelum, tepat pada, dan setelah `retry_after`; pastikan riwayat reject terbaru milik actor untuk project itu menentukan batas, tanpa memblokir project lain atau applicant lain.
- [ ] **Langkah 3: Uji cakupan cooldown lintas role pada project yang sama.** Penolakan di role A harus mencegah actor melamar role B di project yang sama sampai 72 jam; penolakan itu tidak boleh memblokir actor pada project berbeda maupun applicant lain pada project yang sama.
- [ ] **Langkah 4: Implementasikan `POST /projects/:id/apply` secara transaksional.** Kunci project/role, validasi ulang kuota dan status, tolak duplicate, dan simpan pending application.
- [ ] **Langkah 5: Implementasikan pembacaan status viewer dan pending count.** Anonim tidak menerima application state; applicant hanya menerima status dirinya termasuk `retry_after` dari reject terakhir pada project tersebut; pending count hanya terisi untuk owner yang berhak.
- [ ] **Langkah 6: Turunkan `can_claim`, `can_apply`, `can_manage_applications`, serta `can_accept_contributors` dari state persisted.** Pastikan role yang penuh tidak menutup role lain yang masih tersedia dan cooldown actor tidak memengaruhi pengguna lain.
- [ ] **Langkah 7: Tambahkan test detail opsional-auth dan privasi.** Uji guest, applicant pending/rejected/accepted/withdrawn, owner dengan/tanpa pelamar, cooldown per actor/project, serta role quota campuran.
- [ ] **Langkah 8: Jalankan `go test ./internal/modules/project/...`.** Hasil yang diharapkan: seluruh test service/read/DTO lulus.

## Task 4 — Daftar pelamar, review, withdrawal, dan kapasitas

**Berkas:** `internal/modules/project/{dto.go,repository.go,service.go,read_repository.go,read_service.go,handler.go,routes.go,service_test.go,read_service_test.go}`.

**Antarmuka:** `ListProjectApplications`, `ListMyApplications`, `ReviewApplication`, `WithdrawApplication`; endpoint mengikuti tabel kontrak pada spesifikasi.

- [ ] **Langkah 1: Tulis test gagal untuk authorization dan lifecycle.** Hanya owner proyek dapat membaca/review; hanya pemilik lamaran pending dapat withdraw; review hanya menerima `accepted|rejected`; lamaran terminal tidak dapat direview ulang.
- [ ] **Langkah 2: Tulis test penerimaan role dengan satu slot tersisa.** Pastikan transaksi membuat tepat satu contributor membership dan accepted status; request bersamaan tidak melampaui capacity.
- [ ] **Langkah 3: Implementasikan repository/list query dengan profile/role yang dibutuhkan UI.** Batasi field privat dan jangan mengembalikan reviewer note kepada pengunjung lain.
- [ ] **Langkah 4: Implementasikan `ReviewApplication` secara atomik.** Lock project lalu role lalu application dengan urutan konsisten; acceptance memeriksa ulang kuota dan membuat membership; rejection menyimpan note dan `reviewed_at`.
- [ ] **Langkah 5: Implementasikan withdrawal.** Ubah hanya status pending milik actor menjadi withdrawn; simpan `withdrawn_at`; jangan buat cooldown rejection.
- [ ] **Langkah 6: Daftarkan list/detail/review/withdraw handlers.** Parse UUID, validasi payload, gunakan envelope serta error response convention.
- [ ] **Langkah 7: Jalankan `go test ./internal/modules/project/...`.** Hasil yang diharapkan: lifecycle, privacy, authorization, dan concurrency tests lulus.

## Task 5 — Dokumen API dan verifikasi migrasi terisolasi

**Berkas:** `kolaboria-api/docs/project-editor.md`, anotasi Swagger di `handler.go`, `kolaboria-api/docs/{docs.go,swagger.json,swagger.yaml}`, `kolaboria-api/scripts/verify-project-editor.ps1`.

- [ ] **Langkah 1: Tulis pemeriksaan kontrak untuk setiap route, body, error, dan field response.** Pastikan status lamaran, cooldown, kemampuan viewer, dan count pemilik memakai snake_case.
- [ ] **Langkah 2: Perbarui dokumentasi endpoint dan anotasi Swagger.** Dokumentasikan syarat talent verified, aturan owner, cooldown, conflict, dan privasi.
- [ ] **Langkah 3: Perbarui artefak Swagger menggunakan `task swagger` dari root `kolaboria-api`.** Periksa diff hasil generator; jangan edit file generated secara terpisah bila source annotation belum benar.
- [ ] **Langkah 4: Perluas verifier project-editor atau tambahkan verifier khusus.** Ia harus memeriksa migrasi `000010` di database `project_editor_test_*`, menerapkan up/down/up hanya untuk migrasi yang dituju, dan memverifikasi versi migrasi yang lebih awal tetap utuh.
- [ ] **Langkah 5: Jalankan `go test ./...`, `go vet ./...`, dan `go build ./...` dari `kolaboria-api`.** Hasil yang diharapkan: seluruh pemeriksaan selesai dengan exit code 0.
- [ ] **Langkah 6: Jalankan verifier migrasi hanya bila test DB loopback khusus sudah tersedia.** Jika tidak tersedia, laporkan migrasi tertulis tetapi belum dibuktikan pada PostgreSQL.

## Task 6 — Kontrak frontend dan penghapusan jalur simulasi

**Berkas:** `apps/client/app/{types/project.ts,constants/api-endpoints.ts,services/project.service.ts,services/application.service.ts,composables/useProjects.ts,utils/project-presentation.ts,utils/project-detail-simulation.ts}` serta test terkait.

- [ ] **Langkah 1: Tulis test gagal untuk DTO-to-view-model dan endpoint mapping.** Pastikan viewer state, retry timestamp, pending count, claim, apply, review, dan withdraw tidak hilang saat dimapping.
- [ ] **Langkah 2: Jalankan test mapping/service dan pastikan gagal sebelum implementasi.** Jalankan file test spesifik dengan `node --test`.
- [ ] **Langkah 3: Tambahkan tipe request/response eksplisit dan endpoint claim.** Hilangkan penggunaan `any` pada response aplikasi yang disentuh.
- [ ] **Langkah 4: Implementasikan adapter/service/composable ke route API yang disepakati.** Semua operasi membaca envelope API dan memetakan error menggunakan helper error user-facing existing.
- [ ] **Langkah 5: Hapus utilitas simulasi jika pencarian menyatakan tidak ada consumer lain.** Hapus dropdown query, fixture, dummy review/claim, dan test simulasi; pertahankan hanya helper yang masih dipakai di tempat lain.
- [ ] **Langkah 6: Jalankan test kontrak frontend serta `git diff --check`.** Hasil yang diharapkan: tidak ada path `simulate` pada project detail dan tidak ada whitespace error.

## Task 7 — CTA detail, claim confirmation, dan copy per case

**Berkas:** `apps/client/app/pages/projects/[slug]/index.vue`, `app/components/project/ClaimProjectLeadModal.vue` bila diperlukan, `app/utils/project-presentation.ts`, `tests/project-detail-actions.test.mjs`.

- [ ] **Langkah 1: Tulis test mapping state-ke-copy/aksi sebelum mengubah page.** Cakup owner tanpa pending, owner dengan pending, unclaimed, guest, unverified, eligible, pending, rejected cooldown, accepted, kapasitas parsial/penuh, in-progress, completed, archived.
- [ ] **Langkah 2: Pastikan test baru gagal karena query simulasi dan disabled action saat ini.** Jalankan `node --test tests/project-detail-actions.test.mjs`.
- [ ] **Langkah 3: Buat state CTA dari capability dan viewer application API.** Pisahkan pesan owner/applicant/guest/unverified; gunakan string pendek dalam bahasa Indonesia.
- [ ] **Langkah 4: Ganti disabled CTA untuk sign-in/verifikasi dengan langkah yang dapat diklik.** Simpan route kembali ke detail; gunakan CTA apply/claim hanya jika kondisi bisnis mengizinkan.
- [ ] **Langkah 5: Tambahkan konfirmasi claim memakai modal design system existing.** Saat submit, cegah duplikasi hanya selama request; setelah sukses refresh detail; pada konflik refresh dan sampaikan bahwa proyek telah diklaim talent lain.
- [ ] **Langkah 6: Implementasikan ticker owner.** Tanpa lamaran pending dan dengan slot tersisa, sembunyikan ticker; dengan lamaran pending, tampilkan hitungan ringkas dan tombol aktif ke halaman pelamar.
- [ ] **Langkah 7: Compile SFC dan jalankan test detail.** Hasil yang diharapkan: seluruh cabang UI compile serta tests lulus tanpa simulasi.

## Task 8 — Form apply dan halaman pengelolaan lamaran

**Berkas:** `apps/client/app/components/project/ApplyModal.vue`, `pages/projects/[slug]/applicants.vue`, `pages/projects/my-applications.vue`, `services/application.service.ts`, `tests/project-application-flow.test.mjs`.

- [ ] **Langkah 1: Tulis test gagal untuk pengajuan, status pending, review, dan withdrawal.** Pastikan data bertahan setelah reload melalui response API, bukan state lokal.
- [ ] **Langkah 2: Hapus cabang simulasi di `ApplyModal`.** Form valid menyimpan via API dan menampilkan error retryable; role penuh tidak dapat dipilih.
- [ ] **Langkah 3: Ubah guard halaman pelamar menjadi capability/API authorization.** Jangan bandingkan current user dengan `creator_id`; owner hasil claim harus dapat mengelola lamaran dan non-owner harus ditolak.
- [ ] **Langkah 4: Sambungkan review/withdraw dan perbarui daftar dari response canonical.** Accept/reject hanya pada lamaran pending; cooldown tampil sebagai waktu yang ramah pengguna.
- [ ] **Langkah 5: Jalankan test route/page dan test kontrak service.** Hasil yang diharapkan: halaman tidak mengasumsikan route backend lama tanpa kontrak baru.

## Task 9 — Verifikasi gabungan dan audit batas scope

**Berkas:** seluruh berkas Tasks 1–8; tidak ada perubahan produk di luar spesifikasi.

- [ ] **Langkah 1: Jalankan suite frontend penuh `npm test` dari `kolaboria-app/apps/client`.** Catat semua kegagalan, termasuk yang sudah ada sebelum task; jangan menyebut suite lulus bila ada test gagal.
- [ ] **Langkah 2: Jalankan Vue type check dan `npm run build` dari `apps/client`.** Pisahkan masalah yang berasal dari perubahan ini dari baseline lain.
- [ ] **Langkah 3: Jalankan `go test ./...`, `go vet ./...`, `go build ./...`, generator Swagger, dan verifier migrasi DB khusus.** Simpan hasil masing-masing; jangan menyamakan compile/test unit dengan bukti database runtime.
- [ ] **Langkah 4: Uji browser jika API dan DB lokal dapat dijalankan.** Jalankan guest→login, unverified→verify, claim race/conflict, apply, owner manage/accept/reject, cooldown 3 hari, dan perubahan kuota terakhir.
- [ ] **Langkah 5: Audit scope, copy, dan akses.** Pastikan ticker ringkas, tidak ada simulasi/dev selector, CTA yang perlu dilanjutkan tidak dinonaktifkan permanen, data applicant privat, dan tidak ada perubahan Workspace/notifications/start/complete.
- [ ] **Langkah 6: Perbarui Graphify di tiap repo yang kode sumbernya berubah.** Catat bila utilitas Graphify gagal; Graphify tidak menggantikan tes dan pemeriksaan source.

## Cakupan spesifikasi ke tugas

| Bagian spesifikasi | Task |
| --- | --- |
| Keputusan produk yang masih usulan | Task 1 |
| Claim dan conflict/race | Task 2 |
| Application status, detail viewer state, capability, cooldown | Task 3 |
| Pelamar, review, withdrawal, capacity | Task 4 |
| Kontrak API, Swagger, migrasi | Task 1 dan Task 5 |
| Penghapusan simulasi dan typed frontend API | Task 6 |
| Copy dan CTA seluruh state | Task 7 |
| Modal apply dan halaman lamaran | Task 8 |
| Privacy, verifikasi, concurrency, end-to-end acceptance | Task 2–9 |

## Rekomendasi pelaksanaan

Pilih pelaksanaan native dalam satu sesi karena perubahan API harus berjalan berurutan dari migrasi → transaksi/service → DTO/route → frontend, dan banyak aturan berbagi kontrak state yang sama. Setelah plan dan keputusan produknya disetujui, implementasi dapat dikerjakan bertahap mengikuti task di atas, lalu satu reviewer memeriksa diff menyeluruh sebelum penutupan. Tidak ada commit/push dalam rencana ini.
