# Refresh access token

`useApi().$api` dan `useApiFetch` memakai satu alur autentikasi. Ketika request
bersesi menerima HTTP 401, client memanggil `POST /v1/auth/refresh` melalui
`apiBaseUrl`, menyimpan token respons, lalu mengulang request asal satu kali.
Tidak ada reload halaman atau retry tanpa batas.

## Kontrak kolaboria-api

Request refresh menggunakan JSON `{ "refreshToken": "..." }`, tanpa bearer token.
Respons sukses mengikuti envelope `status`, `message`, `data`, dengan
`data.access_token`, `data.refresh_token`, dan `data.user`. Backend saat ini
mengembalikan refresh token yang sama; client tetap menyimpan nilai dari respons.
Envelope gagal dan respons tanpa pasangan token yang lengkap tidak diterapkan.

## Perilaku sesi

- Cookie `auth_token` dan `auth_refresh_token` memakai path `/`, SameSite Lax,
  dan Secure pada production. Refs dan watcher cookie hidup dalam scope aplikasi.
- Request paralel dalam satu aplikasi Nuxt berbagi satu promise refresh. Aplikasi
  Nuxt yang berbeda, termasuk request SSR berbeda, tidak berbagi sesi/promise.
- Body, query, header tambahan, dan signal request asal dipertahankan saat retry.
- Endpoint login/register/logout/refresh dan alur pemulihan akun tidak memicu
  refresh ketika gagal. `/auth/me` tetap mengikuti refresh otomatis.
- Refresh ditolak dengan 401/403, refresh token tidak tersedia, atau retry masih
  menerima 401: hapus token dan state user/profil/onboarding, lalu arahkan sesi
  yang sebelumnya aktif ke `/login`. Request anonim tidak memicu redirect global.
- Error jaringan/server dan respons refresh tidak lengkap dilempar sebagai error
  aman oleh `useApi`, dengan cookie tetap tersedia untuk percobaan berikutnya.
  `fetchCurrentUser` mempertahankan sesi secara default; pemanggil yang memakai
  `preserveSessionOnError: false` tetap memilih kebijakan pembersihan yang lama.
- Respons refresh dan request lama tidak boleh memulihkan sesi setelah logout
  atau mengulang mutasi memakai akun lain. Provenance sesi diperiksa lagi setelah
  menunggu refresh selesai.

## Verifikasi 13 Oktober 2026

18 skenario pada `apps/client/tests/auth-refresh.test.mjs` lulus menggunakan
transport ofetch dan server HTTP lokal. Seluruh suite: 129/136 lulus.
Build production `pnpm build` lulus. Percobaan dalam sandbox sempat gagal
EPERM saat membuat paket Nitro; pengulangan dengan izin filesystem lulus.
Tujuh kegagalan berikut juga direproduksi pada salinan sementara dengan kode
autentikasi dari HEAD sebelum perubahan ini:

- `progressive list loads one combined scope per page`
- `later-page failure keeps the first batch visible and a refresh can recover`
- `late responses from the previous account cannot repopulate a cleared list`
- `unmount prevents a pending response from writing state or fetching later pages`
- `applications page finishes setup and exposes loading while the API is unresolved`
- `applicants page waits for project identity and enforces ownership (owner)`
- `applicants page waits for project identity and enforces ownership (another-user)`

Pemeriksaan `vue-tsc --noEmit -p .nuxt/tsconfig.app.json` masih menemukan lima
error di luar perubahan autentikasi: `ProjectFilterBar.vue` (ProjectType),
`ActivityFeed.vue` (ActivityAction), `useExperiences.ts` (undefined/null), serta
`useProfile.ts` baris 117 dan 181 (string/undefined).

`graphify update .` tidak dapat dijalankan karena executable graphify tidak
tersedia di lingkungan ini.
