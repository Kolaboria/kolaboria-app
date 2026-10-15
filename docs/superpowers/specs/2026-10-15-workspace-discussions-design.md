# Desain Diskusi Workspace

## Tujuan dan cakupan

Membangun fitur diskusi Workspace yang menggunakan data dari server untuk halaman daftar dan detail diskusi. Anggota proyek dapat membaca diskusi, membuat topik dan balasan, mengedit topik atau balasannya sendiri, serta menghapus topik atau balasannya sendiri. Project Owner (yang ditampilkan sebagai Project Lead di produk) dapat menghapus topik atau balasan siapa pun di proyek tersebut. Izin mengelola task saja tidak memberi hak moderasi.

MVP mencakup baca daftar dan detail, membuat topik, membalas, mengedit, menghapus, pagination, otorisasi, validasi, serta state UI untuk loading, kosong, error, dan proses tertunda. Reaksi, lampiran, notifikasi, pencarian, alur moderasi lanjutan, pemulihan posting, dan akses diskusi publik tidak termasuk cakupan.

## Fakta kondisi kode saat ini

- Halaman daftar FE saat ini berada di `workspace/discussion.vue`; route detail berada di `workspace/discussions/:discussionId`.
- Sumber data FE saat ini adalah prototipe Workspace berbasis localStorage. Modul Workspace di BE baru menyediakan data informasi proyek.
- Database memiliki tabel `projects`, `project_members`, dan kolom `owner_id`; belum ada tabel diskusi maupun penetapan Project Lead yang terpisah.
- Skema keanggotaan proyek membedakan owner dan contributor. Status task manager yang ada di prototipe bukan role Project Lead yang tersimpan di backend.

## Aturan domain

- Data diskusi Workspace bersumber dari server. LocalStorage hanya boleh menyimpan draft yang belum dikirim; data tersebut tidak boleh digabungkan atau menimpa topik maupun balasan yang sudah tersimpan di server.
- Anggota aktif proyek dapat membaca diskusi dan, selama status proyek `in_progress`, membuat topik serta balasan.
- Diskusi tetap dapat dibaca oleh pengguna yang berhak mengakses Workspace setelah proyek berstatus `completed` atau `archived`, tetapi menjadi baca-saja.
- Hanya penulis yang boleh mengedit topik atau balasannya sendiri. Penulis atau Project Owner/Project Lead boleh menghapusnya.
- Untuk MVP, `projects.owner_id` menjadi sumber otoritatif Project Lead. Status task manager pada prototipe tidak memberikan hak edit atau hapus. Jika produk memerlukan Project Lead yang berbeda dari owner, role tersebut harus disimpan dan ditentukan oleh server sebelum dapat diberi otorisasi.
- Topik dan balasannya selalu berada dalam cakupan satu proyek. API harus memvalidasi slug proyek sekaligus ID resource untuk mencegah akses lintas proyek.
- Balasan memiliki maksimal dua tingkat yang terlihat: balasan utama pada topik dan balasan lanjutan pada balasan utama. Balasan lanjutan tidak dapat memiliki anak balasan.
- Penghapusan bersifat logis. Topik terhapus tidak muncul di daftar aktif dan URL langsungnya menampilkan bahwa diskusi tidak tersedia. Balasan terhapus ditampilkan sebagai penanda agar konteks balasan turunannya tetap utuh. Isi yang sudah dihapus tidak pernah dikirim kembali oleh API.
- Timestamp dibuat server dalam UTC RFC3339. ID menggunakan UUID. Jumlah dan urutan dihitung dari data tersimpan dan tidak mempercayai angka dari klien.

## Kontrak respons dan error

Pertahankan envelope dan helper API yang sudah ada. Error menggunakan field `status`, `message`, dan `data`; `data.trace_id` serta `data.err_message` tetap menggunakan snake_case. Handler menggunakan `response.ErrorWithException` agar teks exception dikirim pada `err_message`. Jangan mengganti nama field atau bentuk envelope. DTO respons sukses juga wajib memakai field snake_case.

## Kontrak route dan interaksi FE

- Route kanonis daftar: `/projects/:slug/workspace/discussions`.
- Route kanonis detail: `/projects/:slug/workspace/discussions/:discussionId`.
- Route lama `/workspace/discussion` dialihkan ke route daftar plural tersebut.
- Pagination daftar dilakukan oleh server dan tetap stabil saat ada posting baru. Balasan detail dipaginasi berdasarkan balasan utama; balasan lanjutan untuk satu balasan utama dimuat bersama kelompoknya.
- Form mutasi mempertahankan draft jika terjadi kegagalan dan hanya mengosongkannya setelah berhasil. Tombol mencegah pengiriman ganda selama request berlangsung.
- Aksi edit hanya tersedia bagi penulis. Aksi hapus tersedia bagi penulis dan owner/Project Lead. Backend tetap menjadi otoritas izin.

## Antarmuka backend

Gunakan keluarga route Workspace dengan slug proyek:

- `GET /workspaces/{projectSlug}/discussions?cursor=&limit=`
- `POST /workspaces/{projectSlug}/discussions`
- `GET /workspaces/{projectSlug}/discussions/{discussionId}`
- `PATCH /workspaces/{projectSlug}/discussions/{discussionId}`
- `DELETE /workspaces/{projectSlug}/discussions/{discussionId}`
- `GET /workspaces/{projectSlug}/discussions/{discussionId}/replies?cursor=&limit=`
- `POST /workspaces/{projectSlug}/discussions/{discussionId}/replies`
- `PATCH /workspaces/{projectSlug}/discussions/{discussionId}/replies/{replyId}`
- `DELETE /workspaces/{projectSlug}/discussions/{discussionId}/replies/{replyId}`

Pembuatan topik hanya menerima `title` dan `body`; pembuatan balasan hanya menerima `body` dan `parent_reply_id` nullable. Update hanya menerima field teks yang boleh diedit. Identitas aktor, proyek, timestamp, jumlah, dan capability ditentukan oleh server.

## Penyimpanan dan konsistensi

Buat tabel terpisah `workspace_discussions` dan `workspace_discussion_replies`. Simpan ID penulis, foreign key proyek/diskusi, teks, timestamp UTC, waktu aktivitas terakhir, idempotency key beserta hash request untuk operasi create, dan metadata soft-delete. Gunakan relasi komposit atau validasi service agar parent berada dalam diskusi yang sama. Perbarui `last_activity_at` dalam transaksi yang sama dengan setiap mutasi topik/balasan yang terlihat. Pagination stabil menggunakan urutan `(last_activity_at DESC, id DESC)` untuk topik dan `(created_at ASC, id ASC)` untuk balasan utama. Untuk MVP, hindari angka agregat yang diduplikasi; hitung jumlah secara konsisten dari tabel sumber.

Teks berupa plain text dan dirender melalui interpolasi Vue. Batas panjang di FE dan BE harus sama; pertahankan batas balasan 2.000 karakter saat ini dan tetapkan batas eksplisit judul/isi topik sebelum implementasi. Server memvalidasi teks setelah trim dan menghitung panjang karakter Unicode. Operasi create wajib memakai `Idempotency-Key` yang disimpan dengan hash input yang sudah dinormalisasi agar retry jaringan tidak membuat duplikat; pemakaian key yang sama untuk payload berbeda harus ditolak.

## Kriteria penerimaan

1. Anggota berizin melihat topik proyek yang benar, dengan jumlah dan urutan konsisten setelah reload maupun dari perangkat lain.
2. Nonanggota tidak dapat membaca atau mengubah diskusi; ID resource yang tidak cocok dengan proyek menghasilkan not-found tanpa membocorkan data proyek lain.
3. Hanya proyek `in_progress` yang menerima create/reply/update; proyek `completed` dan `archived` hanya baca.
4. Penulis dapat mengedit topik dan balasannya sendiri; pengguna lain tidak dapat mengedit posting tersebut.
5. Penulis dan Project Owner/Lead dapat menghapus topik maupun balasan; task manager tanpa status owner tidak dapat menghapus konten orang lain.
6. Penghapusan topik/balasan mempertahankan integritas percakapan dan teks terhapus tidak dikirim oleh API.
7. FE mempertahankan draft saat validasi atau jaringan gagal dan tidak menampilkan mutasi sebagai tersimpan sebelum server mengonfirmasi.
8. Semua error mempertahankan envelope yang ada, termasuk `trace_id` dan teks exception dalam `data.err_message`.
9. Semua tautan daftar/detail/kembali menggunakan slug proyek dan route plural `/discussions`.
