# Perencanaan Aquanotes Web

Status: implementation plan v2
Tanggal: 26 Agustus 2026
Root web: `D:\Aerasea\Aquanotes-WebApps`
Backend existing: `D:\Aerasea\Aquanotes_FastAPI`
Referensi mobile: `D:\Aerasea\aquanotes-mobile-app`
Referensi visual: `D:\Aerasea\Aquanotes-WebApps\refrensi`
Ide fitur eksploratif: `D:\Aerasea\Aquanotes-WebApps\ide_fitur`

## 1. Ringkasan keputusan

Aquanotes Web akan menjadi satu aplikasi web dengan satu halaman login dan navigasi yang dibentuk oleh role akun. Role awal cukup dua: `user` dan `admin`.

- `user` hanya melihat dan mengelola tambak, kolam, device, alarm, notifikasi, dan data miliknya.
- `admin` melihat seluruh fleet, mendaftarkan `device_id`/UID baru, mengelola assignment dan maintenance, serta melihat audit operasional.
- MVP menggunakan polling API, bukan WebSocket. Data backend saat ini memang request/response; polling 30–60 detik sudah cukup untuk monitoring yang interval device-nya berbasis menit.
- Frontend yang direkomendasikan: React + TypeScript + Vite. Gunakan API browser `fetch`, CSS variables, dan library sesedikit mungkin. Tambahkan router dan chart library hanya saat implementasi membutuhkan.
- Backend web memakai RBAC berbasis akun. Shared `X-API-Key` legacy tetap tersedia untuk kompatibilitas internal, tetapi tidak pernah disimpan atau dikirim oleh browser.
- Bahasa desain mengadaptasi pola dashboard operasional aquaculture pada folder `refrensi`: konteks tambak/kolam yang kuat, KPI, shortcut aktivitas, tabel operasional, dan form bertahap. Identitas visual, copy, ilustrasi, serta struktur produk pihak lain tidak disalin.
- Fitur sampling, siklus, tugas harian, dan prediksi kimia masuk discovery lanjutan. Tautan video pada `ide_fitur` belum cukup menjadi spesifikasi atau kontrak implementasi.

## 2. Kondisi sistem saat ini

### Sudah tersedia di backend

- Registrasi, login, logout, profil, dan bearer token user.
- CRUD tambak dan kolam.
- Claim, edit, pindah, lepas, serta status device milik user.
- Status `online`, `offline`, dan `maintenance`; pengecekan offline berjalan di background berdasarkan `last_seen` dan `connection_interval`.
- Monitoring sensor: suhu, pH, dissolved oxygen, TDS, ammonia, dan salinitas.
- Threshold per device dan notifikasi pelanggaran threshold.
- Ekspor CSV berdasarkan device dan rentang tanggal.
- Riwayat assignment device sehingga histori sensor tetap terikat ke pemilik/periode yang benar.
- Endpoint admin minimum untuk mendaftarkan UID dan melihat semua device, tetapi diamankan dengan satu shared `X-API-Key`.
- Role `user|admin`, endpoint sesi khusus web, dependency `require_admin`, audit log, summary fleet, serta registry device berbasis bearer token telah ditambahkan secara aditif.
- React web shell berbasis role, user dashboard/monitoring/device/notifikasi, serta admin Fleet Overview dan Device Registry telah tersedia.

### Status fondasi dan gap lanjutan

| Gap | Dampak | Keputusan |
|---|---|---|
| Role dan guard admin | Selesai untuk fondasi web | Pertahankan kontrak mobile lama; role dibaca melalui `/users/session` |
| Shared API key admin lama | Masih dipertahankan untuk kompatibilitas internal | Frontend hanya memakai bearer token pada `/admin/fleet/*`; jangan hapus endpoint lama tanpa rencana migrasi |
| Monitoring admin detail | Summary dan registry tersedia, detail telemetry fleet belum lengkap | Tambah endpoint detail monitoring admin saat halaman detail device dikerjakan |
| Field `status` mencampur konektivitas dan mode operasi | Admin dapat menandai online walau device tidak mengirim data | Pisahkan konsep `connectivity_status` (derived) dan `operational_mode` (`active`/`maintenance`) |
| Audit log | Tabel dan pencatatan create/update device tersedia | Tambah list/filter audit serta cakupan assignment dan role saat mutasinya tersedia |
| CORS backend masih wildcard | Tidak layak untuk produksi bersama credential | Batasi ke origin web resmi per environment |
| Ingest sensor hanya mengenali UID | UID saja dapat dipakai untuk mengirim data palsu | Tambah credential/signature per device sebelum produksi luas |
| Pagination admin | Registry sudah paginated dan filterable; derived connectivity masih difilter in-memory | Pindahkan derivasi/filter ke SQL hanya saat ukuran fleet membuatnya terukur lambat |
| Siklus dan sampling | Belum ada domain model/API tervalidasi | Definisikan data, ownership, histori, dan acceptance criteria sebelum membuat UI |
| Prediksi kimia | Baru berupa referensi video | Tetapkan input, formula/model, satuan, confidence, disclaimer, dan validasi ahli sebelum implementasi |

## 3. Sasaran produk

### Sasaran MVP

1. User dapat melakukan pekerjaan yang sudah tersedia di mobile melalui web.
2. Admin dapat mengetahui kesehatan seluruh fleet tanpa membuka akun user satu per satu.
3. Admin dapat membuat UID device baru dan mengelola lifecycle device dengan jejak audit.
4. Perbedaan role ditegakkan backend; menyembunyikan menu di frontend hanya lapisan UX.
5. Kondisi live, stale, offline, dan maintenance dapat dibedakan dengan jelas.

### Bukan bagian MVP

- WebSocket/SSE real-time sub-detik.
- Multi-tenant organisasi dan custom role/permission builder.
- Command/control perangkat jarak jauh selain konfigurasi yang memang didukung backend.
- Peta GIS, digital twin, machine learning baru, billing baru, atau builder dashboard.
- Dark mode jika light mode belum tervalidasi dan belum lengkap.

## 4. Pengguna dan izin

| Kapabilitas | User | Admin |
|---|:---:|:---:|
| Melihat dashboard milik sendiri | Ya | — |
| Monitoring sensor milik sendiri | Ya | Ya, melalui fleet/detail admin |
| Kelola tambak dan kolam milik sendiri | Ya | Read-only pada MVP |
| Claim UID yang sudah didaftarkan | Ya | Dapat membantu assignment |
| Tambah UID baru ke registry | Tidak | Ya |
| Lihat seluruh device dan pemilik | Tidak | Ya |
| Ubah mode maintenance | Device sendiri | Semua device |
| Ubah interval koneksi | Device sendiri | Semua device dengan audit |
| Kelola threshold | Device sendiri | Read-only pada MVP; edit opsional fase berikutnya |
| Lihat notifikasi | Milik sendiri | Ringkasan alert fleet |
| Ekspor data | Milik sendiri | Sesuai scope yang diberi endpoint admin |
| Kelola akun/role | Profil sendiri | Admin lain: fase berikutnya |

Prinsip otorisasi: setiap endpoint menerima actor dari bearer token, mengecek role dan ownership di server, lalu baru menjalankan query. Frontend tidak pernah menjadi sumber kebenaran izin.

## 5. Arsitektur informasi

### Menu user

1. **Ringkasan** — status device, alert aktif, kualitas air terbaru, dan shortcut.
2. **Monitoring** — pilih tambak/kolam/device, current values, tren, waktu update, dan ekspor.
3. **Tambak & Kolam** — daftar, detail, tambah, ubah, hapus.
4. **Device** — claim UID, rename, pindah kolam, interval, maintenance, lepas device.
5. **Alarm & Notifikasi** — threshold, daftar alert, unread count, tandai dibaca.
6. **Profil** — nama, password, logout.

Menu lanjutan hanya muncul setelah backend dan workflow tervalidasi:

7. **Siklus & Sampling** — siklus aktif per kolam, sampling udang, biomassa, dan histori pertumbuhan.
8. **Tugas Operasional** — tugas inspeksi, sampling, serta tindak lanjut alert; bukan gamification pada tahap awal.

### Menu admin

1. **Fleet Overview** — total, online, offline, stale, maintenance, unassigned, dan alert aktif.
2. **Device Registry** — seluruh device, owner, lokasi, last seen, mode, search/filter/sort.
3. **Tambah Device ID** — buat UID baru satu per satu; bulk import ditunda.
4. **Assignments** — assign/unassign device ke user dan konteks tambak/kolam bila endpoint sudah tersedia.
5. **Alerts** — pelanggaran threshold dan device offline lintas user.
6. **Users** — daftar dan detail ringkas read-only pada MVP.
7. **Audit Log** — siapa mengubah apa dan kapan.
8. **Profil** — identitas akun dan logout.

### Konteks kerja global

Pola utama yang diadaptasi dari referensi adalah pemilihan konteks sebelum membaca atau mengubah data:

```text
User:  Tambak → Kolam → Device → rentang waktu
Admin: Fleet → owner/lokasi → Device → rentang waktu
```

- Konteks aktif terlihat di header halaman data dan tersimpan di URL bila memungkinkan.
- Shortcut seperti Monitoring, Kualitas Air, Device, dan Notifikasi mengikuti konteks aktif.
- Shortcut Sampling, Siklus, dan Prediksi Kimia tidak ditampilkan sebelum fiturnya benar-benar tersedia.
- User mengutamakan aktivitas budidaya; admin mengutamakan pencarian, triage, tabel, dan audit.

## 6. Alur utama

### Login dan routing role

1. User mengirim email dan password ke `/users/login`.
2. Backend mengembalikan bearer token.
3. Frontend memanggil `/users/session` untuk memperoleh profil ringkas dan `role`; kontrak lama `/users/me` tetap tidak berubah untuk kompatibilitas mobile.
4. Router mengarahkan `admin` ke `/admin`, selain itu ke `/app`.
5. Route guard memperbaiki UX, tetapi backend tetap menolak akses yang tidak berhak dengan 403.
6. Saat 401, hapus sesi dan kembali ke login. Jangan simpan atau auto-login memakai password plaintext.

### Admin menambah device baru

1. Buka **Tambah Device ID**.
2. Masukkan atau generate UID sesuai aturan backend.
3. Validasi format dan cek duplikasi di server.
4. Tampilkan ringkasan sebelum submit.
5. Backend membuat device tanpa owner dan mencatat audit.
6. Success state menampilkan UID serta aksi **Salin ID** dan **Lihat di Registry**.

### Admin mengubah mode device

1. Buka detail device.
2. Tampilkan `last_seen`, connectivity, owner, lokasi, dan mode saat ini.
3. Perubahan ke maintenance meminta alasan singkat dan konfirmasi.
4. Backend mengubah `operational_mode`, bukan memalsukan connectivity.
5. Audit log menyimpan actor, device, nilai lama/baru, alasan, dan timestamp.

### User monitoring

1. Pilih tambak, kolam, dan device.
2. Tampilkan nilai terakhir beserta timestamp dan label fresh/stale/offline.
3. Tren default menampilkan window data yang masuk akal; user dapat memilih parameter dan rentang.
4. Threshold divisualkan sebagai garis/band dan pelanggaran diberi marker serta teks.
5. Ekspor CSV memakai scope ownership dari backend.

### User membuat struktur tambak

Gunakan wizard singkat yang mengadaptasi pola referensi:

1. **Informasi Tambak** — nama, lokasi, alamat, dan jenis budidaya.
2. **Informasi Kolam** — nama, tipe, dimensi, kedalaman, dan komoditas.
3. **Pasangkan Device** — opsional; claim UID yang sudah terdaftar.
4. **Konfirmasi** — ringkasan perubahan sebelum submit.

Simpan setiap entity menggunakan endpoint existing. Jangan membuat transaksi lintas-step semu di frontend; bila atomic creation diperlukan, tambahkan endpoint backend eksplisit terlebih dahulu.

### Discovery sampling dan prediksi

Sebelum masuk backlog implementasi, sampling harus menentukan minimal: tanggal/umur siklus, jumlah sampel, berat total/rata-rata, metode sampling, petugas, kolam, foto opsional, serta aturan koreksi data. Prediksi kimia harus menentukan input telemetry, bahan kimia yang dicakup, target kualitas air, satuan dosis, batas aman, confidence, sumber formula/model, dan kewajiban review manusia. Keduanya wajib menyimpan provenance serta tidak boleh menyajikan estimasi sebagai fakta sensor.

## 7. Kontrak status device

Status harus dapat dijelaskan, bukan sekadar warna.

| Istilah UI | Sumber | Aturan |
|---|---|---|
| Online | Derived dari `last_seen` | `last_seen` masih dalam batas `2 × connection_interval` |
| Stale | Derived untuk peringatan dini | Mendekati atau baru melewati interval yang diharapkan; tetapkan batas eksplisit di backend/API |
| Offline | Derived dari `last_seen` | Melewati batas offline |
| Maintenance | Mode operasional manual | Tidak mengubah fakta kapan telemetry terakhir diterima |
| Belum pernah aktif | `last_seen = null` | Device terdaftar tetapi belum pernah mengirim telemetry |

Rekomendasi model minimum:

```text
connectivity_status: online | stale | offline | never_seen
operational_mode: active | maintenance
last_seen: ISO-8601 UTC
connection_interval_minutes: integer
```

## 8. Perubahan backend minimum

### Database dan auth

- Tambah `users.role` dengan nilai terbatas `user|admin`, default `user`, non-null.
- Sediakan `/users/session` berisi profil ringkas dan `role`; jangan menambah field pada `/users/me` agar kontrak mobile tetap stabil.
- Buat dependency `require_admin` yang memakai `get_current_user`.
- Migrasikan `/admin/*` dari `X-API-Key` ke `require_admin`.
- Tambah tabel `audit_logs`: `id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `before_json`, `after_json`, `reason`, `created_at`.
- Batasi CORS berdasarkan environment.
- Jangan log bearer token, password, API key, atau device secret.

### Endpoint yang dapat dipakai ulang

Endpoint user saat ini tetap dipakai untuk user: `/users/*`, `/tambak/*`, `/kolam/*`, `/devices/*`, `/monitoring`, `/notifications/*`, `/export/csv`.

### Endpoint admin yang perlu ditambah/ubah

| Method | Endpoint | Tujuan |
|---|---|---|
| GET | `/admin/summary` | KPI fleet dan jumlah alert |
| GET | `/admin/fleet/devices` | List paginated dengan search/filter; sudah tersedia |
| POST | `/admin/fleet/devices` | Daftarkan UID baru; sudah tersedia |
| GET | `/admin/fleet/devices/{id}` | Detail, owner, lokasi, last seen, dan status; sudah tersedia |
| PATCH | `/admin/fleet/devices/{id}` | Nama, interval, operational mode; field allowlist dan audit; sudah tersedia |
| POST | `/admin/fleet/devices/{id}/assign` | Assignment eksplisit dan tervalidasi |
| POST | `/admin/fleet/devices/{id}/unassign` | Tutup assignment aktif tanpa menghapus histori |
| GET | `/admin/fleet/devices/{id}/monitoring` | Telemetry dan tren satu device |
| GET | `/admin/alerts` | Alert fleet paginated |
| GET | `/admin/users` | User read-only paginated |
| GET | `/admin/audit-logs` | Audit paginated dan filterable |

Semua list admin menggunakan bentuk konsisten:

```json
{
  "items": [],
  "page": 1,
  "page_size": 25,
  "total": 0
}
```

### Perbaikan keamanan sebelum go-live

- Hapus pola auto-login menggunakan email/password tersimpan; gunakan token lifecycle yang aman atau refresh token terpisah.
- Rotasi secret yang pernah ditaruh di file lokal/terlihat di editor, pindahkan ke environment/secret manager, dan pastikan file credential di-ignore Git.
- Tambah autentikasi per device untuk endpoint ingest sensor; minimal device secret unik dan signature/timestamp anti-replay.
- Tambah rate limit login dan ingest.
- Pastikan semua timestamp API memakai UTC ber-offset (`Z`) dan frontend memformat ke zona user.

## 9. Arsitektur frontend yang direkomendasikan

```text
src/
├── app/              # router, session, app shell
├── api/              # fetch wrapper dan kontrak API
├── features/
│   ├── auth/
│   ├── monitoring/
│   ├── devices/
│   ├── farms/
│   ├── notifications/
│   └── admin/
├── components/       # komponen UI lintas fitur yang benar-benar dipakai ulang
├── styles/           # tokens.css dan global.css
└── assets/           # logo hasil normalisasi dari Assets/
```

Aturan implementasi:

- Satu `apiFetch` untuk base URL, bearer token, JSON error, dan 401 handling.
- Satu session context/store; jangan membuat state library sebelum kebutuhan terbukti.
- URL menjadi sumber state untuk page, search, filter, sort, dan selected device agar deep link/back bekerja.
- Gunakan polling adaptif: berhenti saat tab tersembunyi, beri tombol pause/resume, dan tampilkan waktu update terakhir.
- Data tabel lebih dari 25 baris menggunakan server pagination. Virtualization baru diperlukan bila profiling membuktikan perlu.
- Validasi trust boundary tetap di backend; frontend memberi feedback lebih cepat, bukan menggantikan validasi server.

## 10. Fase pengerjaan

### Fase 0 — kontrak dan keamanan — fondasi selesai, hardening produksi tersisa

- Migrasi `role` dan endpoint `/users/session` tanpa mengubah `/users/me`.
- `require_admin` dan endpoint bearer-token admin baru tanpa mengubah kontrak API-key legacy.
- Definisi status connectivity vs operational mode.
- CORS production dan strategi token.
- OpenAPI menjadi kontrak frontend.

**Exit:** akun admin dapat login dan endpoint admin menolak user biasa melalui test 403.

### Fase 1 — fondasi web — selesai

- Vite + React + TypeScript.
- Design tokens, reset/base styles, asset logo, route shell.
- Login, session restore, logout, 401/403/404 states.
- Sidebar/topbar responsif berdasarkan role.

**Exit:** dua role masuk ke shell berbeda; keyboard navigation dan mobile layout berfungsi.

### Fase 2 — user MVP — berjalan

- Ringkasan user.
- Tambak, kolam, dan device berdasarkan endpoint existing.
- Monitoring nilai terakhir dan chart tren.
- Threshold, notifikasi, dan ekspor CSV.
- Wizard Tambak → Kolam → Device dengan endpoint existing.

**Exit:** workflow inti mobile tersedia di web tanpa melewati ownership check.

### Fase 3 — admin MVP — berjalan

- Fleet Overview.
- Device Registry + detail.
- Tambah UID.
- Maintenance, interval, assignment/unassignment.
- Alerts, user read-only, dan audit log.

**Exit:** admin dapat menemukan device bermasalah, melakukan aksi, dan melihat catatan aksinya.

### Fase 4 — hardening

- Test akses lintas role dan IDOR.
- Loading/error/empty/stale/offline states.
- Accessibility dan responsive QA.
- Performance test untuk fleet realistis.
- Observability frontend dan runbook deployment.

### Fase 5 — operasi budidaya (setelah discovery)

- Model siklus budidaya dan status aktif/selesai.
- Sampling udang dan tren biomassa/pertumbuhan.
- Tugas operasional yang berasal dari jadwal atau alert, tanpa leaderboard/gamification awal.
- Prediksi kimia hanya setelah formula/model, batas aman, provenance, dan review domain disetujui.

**Exit:** hasil sampling dapat diaudit dan prediksi selalu dibedakan jelas dari telemetry aktual.

## 11. Strategi pengujian

### Backend

- User selalu 403 pada semua endpoint admin.
- Admin tidak dapat melewati field allowlist atau mengubah connectivity derived.
- Assignment tetap hanya satu yang aktif per device.
- Audit log dibuat untuk setiap mutasi admin dan tidak dapat diedit dari API publik.
- Pagination, search, filter, dan sort memiliki test boundary.
- Sensor ingest menolak signature invalid/replay setelah device auth diterapkan.

### Frontend

- Login → `/users/session` → route role yang benar.
- Refresh halaman mempertahankan session tanpa menyimpan password.
- 401 logout aman; 403 menampilkan halaman akses ditolak.
- Filter tabel tersimpan di URL dan back/forward browser bekerja.
- Polling berhenti saat tab hidden dan dapat dipause.
- Form mutasi mencegah double submit dan menampilkan error server yang dapat ditindaklanjuti.
- Keyboard-only, screen reader labels, 200% zoom, reduced motion, serta viewport 375/768/1024/1440.

## 12. Definition of Done MVP

- Tidak ada admin secret di bundle frontend, source map, local storage, atau repository.
- Semua menu dan endpoint lolos matrix role/ownership.
- Admin dapat melihat seluruh device, last seen, owner, lokasi, connectivity, dan operational mode.
- Admin dapat mendaftarkan UID dan mengubah maintenance/interval dengan audit.
- User hanya melihat resource miliknya dan dapat monitoring, threshold, notifikasi, serta export.
- Status selalu menyertakan teks dan timestamp; warna bukan satu-satunya pembeda.
- Chart memiliki nilai ringkas dan alternatif tabel.
- Semua form memiliki label, inline error, loading, success, dan recovery path.
- Tidak ada horizontal scroll pada 375px; tabel admin beralih ke card/column priority atau scroll container yang berlabel.
- CORS, token handling, secret handling, dan device ingest telah direview sebelum produksi.

## 13. Rekomendasi setelah MVP

Tambahkan hanya bila penggunaan nyata membuktikan kebutuhan:

- Bulk provisioning device melalui CSV.
- Acknowledgement dan assignment alert ke operator.
- Saved views/filter admin.
- Scheduled report.
- SSE/WebSocket bila polling menimbulkan beban atau latency tidak memenuhi target.
- Role tambahan seperti `operator` atau `support` bila dua role terlalu luas.
- Multi-tenant organisasi bila Aquanotes melayani beberapa perusahaan dengan admin terpisah.
- Help center atau chatbot hanya bila tersedia knowledge base terkurasi, ownership konten, dan jalur eskalasi manusia.
- Modul keuangan hanya setelah kebutuhan akuntansi, kategori transaksi, permission, dan rekonsiliasi didefinisikan.
- Promosi, loyalty points, dan leaderboard tidak masuk arah produk operasional saat ini.
