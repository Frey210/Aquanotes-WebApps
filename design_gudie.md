# Aquanotes Web Design Guide

Status: design direction v2
Nama file mengikuti permintaan awal (`design_gudie.md`).
Sumber visual: logo pada `Assets/`, design language aplikasi mobile Aquanotes, dan pola produk aquaculture pada `refrensi/`.

## 1. Arah desain

Aquanotes Web adalah dashboard operasional budidaya air: tenang, presisi, terpercaya, dan cepat dipindai. Arah visualnya bernama **Clean Aquaculture Operations**: shell biru yang kuat, workspace terang, kartu data bersih, dan densitas yang berubah mengikuti role. Hindari dekorasi yang membuat data terlihat seperti landing page pemasaran.

Tiga prinsip:

1. **Kondisi dulu, dekorasi kemudian.** Status, nilai sensor, timestamp, dan tindakan harus terbaca dalam beberapa detik.
2. **Satu sistem, dua peran.** User dan admin berbagi bahasa visual serta komponen; perbedaannya pada scope data dan navigasi.
3. **Kejujuran telemetry.** Label “live” hanya tampil bila data benar-benar fresh. Selalu tampilkan waktu update dan stale/offline state.
4. **Konteks sebelum aksi.** User harus selalu tahu tambak, kolam, device, dan periode data yang sedang aktif sebelum melakukan perubahan.
5. **Progressive disclosure.** Workflow panjang menggunakan stepper, drawer, atau dialog; jangan menaruh seluruh konfigurasi di dashboard.

### Pola referensi yang diadaptasi

| Pola | Adaptasi Aquanotes | Batas |
|---|---|---|
| Sidebar biru + workspace terang | App shell utama untuk desktop | Struktur menu mengikuti fitur Aquanotes, bukan menu produk referensi |
| Pemilih tambak/kolam | Context bar global pada halaman user | Device dan periode tetap eksplisit; jangan menyembunyikan scope |
| Shortcut aktivitas | Monitoring, Kualitas Air, Device, Notifikasi | Sampling/Siklus baru muncul setelah backend tersedia |
| KPI lalu detail | Ringkasan status sebelum tabel/chart | KPI selalu dapat ditelusuri ke data sumber |
| Form bertahap | Tambak → Kolam → Device → Konfirmasi | Setiap step mengikuti kontrak backend yang nyata |
| Tabel operasional padat | Registry, alert, user, audit | User view lebih lapang; admin boleh lebih dense |
| Dialog/onboarding kontekstual | Bantuan first-run dan konfirmasi aksi | Tanpa promo interstitial atau tutorial yang memblokir kerja rutin |

Jangan menyalin logo, ilustrasi, copy, warna persis, promotional banner, loyalty points, atau layout pixel-for-pixel dari referensi. Chatbot, keuangan, daily task, dan prediksi hanya dirancang bila fungsi serta sumber datanya sudah ditetapkan.

## 2. Relasi brand

- **Aquanotes** adalah product brand dan menjadi logo utama di header/login.
- **Aerasea** adalah parent/company brand dan dapat tampil sebagai endorsement kecil: “by Aerasea” di login atau footer.
- Jangan memberi kedua logo bobot visual yang sama di app shell; ini mengganggu orientasi produk.

### Aset sumber

| File | Dimensi | Pemakaian |
|---|---:|---|
| `Assets/aquanotes-logo.PNG` | 2169×469 | Wordmark utama pada background terang |
| `Assets/aerase-logo-biru.PNG` | 419×416 | Endorsement pada background terang |
| `Assets/aerase-logo-putih.jpg` | 640×640 | Referensi versi putih; JPG memiliki background biru |

Sebelum implementasi produksi, siapkan turunan SVG atau PNG transparan yang bersih. Jangan mengubah proporsi, warna, susunan huruf, atau menambahkan shadow.

### Aturan logo

- Clear space minimum: tinggi bagian mark/tetes pada logo.
- Wordmark Aquanotes minimum 120px digital; di header desktop gunakan 144–176px.
- Pada mobile, gunakan wordmark minimum 120px atau icon resmi jika versi icon tersedia.
- Gunakan logo full-color hanya pada permukaan putih/terang.
- Gunakan versi putih resmi pada background biru/gelap; jangan membuat inversi CSS dari raster.
- Jangan crop, stretch, rotate, memberi gradient, outline, atau efek glow.
- Alt text wordmark: `Aquanotes`. Logo dekoratif di samping nama teks menggunakan alt kosong.

## 3. Warna

Warna brand dikonsolidasikan dari aplikasi mobile dan pixel dominan logo. Nilai logo dominan: `#2184C3`, `#26A9E0`, `#00ADEF`; warna aksi existing app: `#198AFF`; navy existing app: `#074590`.

Token menggunakan tiga lapis dan komponen tidak boleh melewati lapisan semantic:

```text
Primitive (nilai mentah) → Semantic (tujuan) → Component (implementasi)
```

### Primitive tokens

| Token | Nilai | Kegunaan |
|---|---:|---|
| `blue-900` | `#074590` | Navy brand, heading penting |
| `blue-600` | `#2184C3` | Brand supporting blue |
| `blue-500` | `#198AFF` | Primary action dan focus |
| `cyan-500` | `#26A9E0` | Data series/aksen Aquanotes |
| `cyan-400` | `#00ADEF` | Highlight ringan |
| `teal-600` | `#008783` | Success/online text yang kontras |
| `amber-700` | `#A15C00` | Warning/stale text |
| `red-700` | `#B42318` | Error/offline/destructive text |
| `slate-950` | `#0F172A` | Text utama |
| `slate-700` | `#334155` | Text sekunder |
| `slate-500` | `#64748B` | Metadata pada background putih |
| `slate-300` | `#CBD5E1` | Border kuat |
| `slate-200` | `#E2E8F0` | Divider/border default |
| `slate-100` | `#F1F5F9` | Surface muted |
| `slate-50` | `#F8FAFC` | Page background |
| `white` | `#FFFFFF` | Card/surface |

`teal-600`, `amber-700`, dan `red-700` sengaja lebih gelap daripada warna dekoratif umum agar teks status lebih mungkin memenuhi kontras pada surface terang. Kontras final tetap harus dihitung pada kombinasi aktual.

### Semantic tokens — light theme

```css
:root {
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F1F5F9;
  --color-text: #0F172A;
  --color-text-muted: #475569;
  --color-border: #E2E8F0;
  --color-primary: #198AFF;
  --color-on-primary: #FFFFFF;
  --color-primary-hover: #0876E2;
  --color-primary-strong: #074590;
  --color-focus: #198AFF;
  --color-online: #008783;
  --color-stale: #A15C00;
  --color-offline: #B42318;
  --color-maintenance: #5B4DB7;
  --color-info: #2184C3;
  --color-overlay: rgb(15 23 42 / 0.56);
}
```

### Component tokens

```css
:root {
  --sidebar-bg: var(--color-primary-strong);
  --sidebar-fg: var(--color-on-primary);
  --sidebar-item-active-bg: var(--color-primary);
  --context-bar-bg: var(--color-surface);
  --context-bar-border: var(--color-border);
  --card-bg: var(--color-surface);
  --card-border: var(--color-border);
  --card-radius: var(--radius-lg);
  --button-primary-bg: var(--color-primary);
  --button-primary-fg: var(--color-on-primary);
  --input-bg: var(--color-surface);
  --input-border: var(--color-border);
  --input-focus: var(--color-focus);
  --dialog-bg: var(--color-surface);
  --dialog-scrim: var(--color-overlay);
}
```

Component harus selalu menunjuk semantic token dan tidak memakai nilai hex/RGB langsung di JSX atau stylesheet komponen.

### Status treatment

| Status | Label | Ikon | Warna | Pendamping |
|---|---|---|---|---|
| Online | Online | check-circle | teal | “Diperbarui 1 mnt lalu” |
| Stale | Data terlambat | clock-warning | amber | waktu update dan batas expected |
| Offline | Offline | cloud-slash | red | “Terakhir terlihat …” |
| Maintenance | Maintenance | wrench | violet | alasan dan actor bila tersedia |
| Never seen | Belum aktif | minus-circle | slate | instruksi aktivasi |

Jangan memakai dot berwarna tanpa teks. Maintenance dapat hadir bersama offline; operational mode dan connectivity harus ditampilkan sebagai dua fakta terpisah.

### Dark mode

Dark mode ditunda sampai light theme lengkap. Bila dibuat, mapping dilakukan pada semantic tokens dan diuji ulang; jangan membalik warna secara otomatis atau menaruh blur/glass di semua card.

## 4. Tipografi

Gunakan **Inter**, mengikuti font lokal aplikasi mobile. Ini menghindari download font baru dan menjaga kesinambungan antarplatform.

```css
--font-sans: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
--font-mono: ui-monospace, "SFMono-Regular", Consolas, monospace;
```

Gunakan font mono hanya untuk UID, token yang sudah dimasking, dan angka teknis yang perlu alignment. Data numerik menggunakan `font-variant-numeric: tabular-nums`.

| Role | Desktop | Mobile | Weight | Line height |
|---|---:|---:|---:|---:|
| Page title | 32px | 28px | 700 | 1.2 |
| Section title | 20px | 18px | 600 | 1.3 |
| Card metric | 28px | 24px | 700 | 1.15 |
| Body | 16px | 16px | 400 | 1.5 |
| Label/button | 14px | 14px | 600 | 1.4 |
| Metadata | 13px | 13px | 400 | 1.45 |
| Table header | 12px | 12px | 600 | 1.4 |

- Jangan gunakan body text di bawah 14px; base tetap 16px.
- Heading maksimal sekitar dua baris.
- Paragraf panjang maksimal 65–75 karakter per baris.
- UID boleh dipotong visual dengan ellipsis, tetapi nilai lengkap harus bisa disalin dan diakses keyboard.

## 5. Spacing, radius, elevation

Gunakan grid 4px dengan langkah utama 8px.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;

--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-pill: 999px;

--shadow-sm: 0 1px 2px rgb(15 23 42 / 0.06);
--shadow-md: 0 8px 24px rgb(15 23 42 / 0.08);
```

- Card dashboard: radius 14px, border 1px, shadow-sm opsional.
- Input/button: radius 10px; jangan mewarisi radius 16px mobile secara membabi buta pada tabel padat.
- Modal boleh memakai shadow-md. Hindari shadow besar pada setiap card.
- Tidak ada gradient dekoratif pada area data. Gradient brand hanya boleh menjadi aksen kecil pada login/empty state.

## 6. Layout responsif

### Breakpoints acuan

| Viewport | Layout |
|---:|---|
| 375–767px | Top bar + drawer; satu kolom; actions penting sticky bila aman |
| 768–1023px | Collapsible rail; grid 2 kolom |
| 1024–1439px | Sidebar 240px; content grid 12 kolom |
| ≥1440px | Sidebar 256px; content max 1600px; gutter 32px |

### App shell desktop

```text
┌──────────────┬────────────────────────────────────────────┐
│ AquaNotes    │ Page title        Updated …   Alerts User │
│              ├────────────────────────────────────────────┤
│ Role menu    │ Filter / actions                            │
│              │                                            │
│              │ Main content                               │
│              │                                            │
└──────────────┴────────────────────────────────────────────┘
```

- Sidebar tetap konsisten antarhalaman; role hanya mengubah item yang tersedia.
- Main content menggunakan padding 24px desktop, 16px mobile.
- Maksimum satu primary action per halaman.
- Pada mobile, tabel diprioritaskan menjadi cards/essential columns. Horizontal scroll hanya untuk data yang memang berbentuk matriks, dengan container berlabel.

### Context bar dan shortcut aktivitas

Halaman berbasis data user memakai context bar tetap di awal konten, bukan selector yang tersebar di setiap card:

```text
[Tambak ▼] [Kolam ▼] [Device ▼] [Periode ▼]                 [Refresh]
[Monitoring] [Kualitas Air] [Device] [Notifikasi] [Sampling*] [Siklus*]
```

`*` hanya muncul setelah fitur tersedia. Context bar bukan global app state tersembunyi: pilihan tercermin di URL dan heading/detail tetap menyebut objek aktif.

- Desktop: selector satu baris, shortcut dapat wrap tanpa horizontal carousel.
- Tablet: selector maksimal dua kolom; shortcut menjadi segmented toolbar yang dapat wrap.
- Mobile: selector ditampilkan berurutan atau melalui bottom sheet; hanya 3–5 shortcut terpenting terlihat.
- Admin mengganti context bar dengan search, filter connectivity/mode/assignment, dan saved view hanya bila kebutuhan sudah terbukti.
- Pergantian konteks mempertahankan loading dimension dan tidak menampilkan data lama dengan label objek baru.

### Densitas berdasarkan role

| Area | User | Admin |
|---|---|---|
| Fokus | Aktivitas dan kondisi kolam | Triage fleet dan audit |
| Card padding | 20–24px | 16–20px |
| Table row | 52–56px | 44–48px |
| Primary content | KPI, chart, next action | Search, filter, table, exception |
| Secondary detail | Progressive disclosure | Kolom tambahan dan drawer detail |

## 7. Navigasi per role

### User

| Label | Ikon | Route |
|---|---|---|
| Ringkasan | house | `/app` |
| Monitoring | chart-line | `/app/monitoring` |
| Tambak & Kolam | map-pin-area | `/app/farms` |
| Device | cpu | `/app/devices` |
| Alarm & Notifikasi | bell | `/app/alerts` |
| Profil | user-circle | `/app/profile` |

Setelah discovery dan backend tersedia, tambahkan **Siklus & Sampling** sebagai satu destination terlebih dahulu. Jangan langsung memecahnya menjadi banyak menu atau menampilkan menu kosong/disabled.

### Admin

| Label | Ikon | Route |
|---|---|---|
| Fleet Overview | gauge | `/admin` |
| Device Registry | cpu | `/admin/devices` |
| Assignments | arrows-left-right | `/admin/assignments` |
| Alerts | warning-circle | `/admin/alerts` |
| Users | users | `/admin/users` |
| Audit Log | clipboard-text | `/admin/audit` |
| Profil | user-circle | `/admin/profile` |

Gunakan satu keluarga SVG icon: Phosphor yang sudah terpasang. Semua item selalu memiliki ikon dan label; jangan memakai emoji atau mencampur stroke style pada hierarchy yang sama.

Pada user view, aktivitas yang sering dipakai boleh hadir sebagai shortcut kontekstual tanpa menduplikasi hierarchy sidebar. Pada admin view, hindari shortcut budidaya; gunakan filter dan exception queue.

## 8. Halaman inti

### Login

- Desktop: panel brand maksimal 40% dan form maksimal 420px.
- Mobile: hanya wordmark, heading, form, dan endorsement kecil Aerasea.
- Field memiliki label terlihat, autocomplete (`email`, `current-password`), show/hide password, dan paste/password manager diperbolehkan.
- Error generik untuk kredensial salah; jangan mengungkap apakah email terdaftar.
- Tidak ada pilihan role. Role berasal dari akun server.

### User dashboard

Urutan:

1. Greeting singkat dan waktu update.
2. KPI: device online/total, alert aktif, kolam dipantau.
3. “Perlu perhatian” untuk offline/stale/threshold breach.
4. Ringkasan kualitas air terbaru per kolam.
5. Shortcut ke monitoring dan ekspor.

### Fleet Overview admin

Urutan:

1. KPI: total, online, stale/offline, maintenance, unassigned.
2. Alert strip hanya bila ada kondisi kritis.
3. Tabel “Perlu perhatian” dengan last seen, owner, lokasi, dan action.
4. Distribusi connectivity dan tren kejadian offline bila data tersedia.
5. Aktivitas admin terbaru.

KPI bukan pengganti tabel. Setiap card dapat membuka list yang sudah terfilter.

### Device Registry

Kolom default desktop:

1. Device name + UID.
2. Connectivity.
3. Operational mode.
4. Owner.
5. Tambak / kolam.
6. Last seen.
7. Interval.
8. Actions.

Search menerima UID, nama device, owner, dan lokasi. Filter tampil sebagai chips yang dapat dihapus dan tercermin di URL. Bulk actions ditunda sampai ada use case nyata.

### Device detail

- Header: nama, UID/copy, connectivity, operational mode.
- Metadata: owner, tambak/kolam, last seen, interval, assignment start.
- Current readings: enam metric cards dengan unit dan status threshold.
- Tren: parameter switcher, rentang waktu, pause/resume, tabel alternatif.
- Actions: edit metadata, maintenance, assignment; destructive action dipisahkan.
- Audit: lima aktivitas terakhir dan link ke audit lengkap.

### Tambah Device ID

- Form pendek: UID dan optional internal note bila backend mendukung.
- UID dapat ditempel/scanned; generator hanya jika aturan UID telah ditetapkan backend.
- Tampilkan inline duplicate error.
- Setelah sukses: jangan reset hasil secara tiba-tiba; tampilkan UID, copy action, dan link registry.

### Wizard Tambak dan Kolam

Stepper desktop dan mobile memakai empat tahap: **Informasi Tambak → Informasi Kolam → Pasangkan Device → Konfirmasi**.

- Step aktif memiliki label dan nomor/icon; status tidak disampaikan melalui warna saja.
- Form maksimal 640px agar scanning mudah; field lokasi dikelompokkan secara logis.
- User dapat kembali tanpa kehilangan input. Konfirmasi meninggalkan wizard bila ada perubahan belum tersimpan.
- Pasangkan Device bersifat opsional bila workflow backend mengizinkan tambak/kolam tanpa device.
- Halaman konfirmasi menampilkan ringkasan tekstual, bukan ilustrasi besar yang menggeser informasi penting.
- Submit final baru aktif ketika step wajib valid dan menampilkan progress tanpa mengubah lebar tombol.

### Siklus dan Sampling — arah desain, belum implementasi

- Header selalu menyebut kolam, siklus aktif, dan umur budidaya.
- Form sampling memprioritaskan tanggal, jumlah sampel, berat rata-rata/total, metode, dan petugas.
- Histori menggunakan tabel plus line chart biomassa/pertumbuhan; nilai koreksi diberi actor, alasan, dan timestamp.
- Nilai aktual, estimasi, dan target memakai label/legend berbeda—bukan hanya warna.
- Empty state menjelaskan cara memulai siklus atau mencatat sampling pertama.

### Prediksi Kimia — arah desain, belum implementasi

- Tampilkan telemetry input, target, rekomendasi dosis, unit, confidence, waktu kalkulasi, dan sumber formula/model.
- Bedakan jelas **Aktual**, **Estimasi**, dan **Rekomendasi**.
- Gunakan warning permanen bahwa rekomendasi memerlukan verifikasi operator/ahli; jangan memakai CTA otomatis yang memberi kesan device akan mengeksekusi dosis.
- Hasil tidak boleh dirancang sebelum aturan domain, batas aman, dan recovery bila input stale/offline disetujui.

### User management admin

- List user mengutamakan nama, email, role, jumlah device, status verifikasi, dan last activity bila tersedia.
- Perubahan role atau status memakai dialog yang menjelaskan dampak dan selalu membuat audit log.
- Form profil memakai label terlihat, grouping sederhana, read-only email bila backend belum mendukung perubahan, serta inline error.
- OTP/verifikasi tidak diadopsi hanya karena ada di referensi; tampilkan hanya setelah backend memiliki workflow dan channel verifikasi resmi.

### Onboarding dan bantuan

- First-run guidance maksimal 3 langkah dan dapat dilewati/ditutup.
- Gunakan callout kontekstual di dekat aksi, bukan overlay biru penuh untuk pengguna berulang.
- Help drawer atau chatbot baru layak setelah knowledge base terkurasi tersedia; selalu sediakan jalur menuju bantuan manusia.
- Promo interstitial, loyalty point, streak, dan leaderboard tidak termasuk design language Aquanotes saat ini.

## 9. Komponen

### Button

| Variant | Penggunaan |
|---|---|
| Primary | Satu aksi utama halaman/form |
| Secondary | Aksi aman alternatif |
| Ghost | Toolbar/table action |
| Destructive | Delete/unassign; selalu berlabel |

Height default 40px, large 48px, icon-only minimum hit area 44×44px. Loading menonaktifkan repeat submit dan mempertahankan lebar label.

### Input

- Label selalu terlihat di atas field.
- Height default 44px; textarea sesuai konten.
- Helper text untuk format UID/interval.
- Error di bawah field dan terhubung melalui `aria-describedby`.
- Validasi setelah blur atau submit, bukan memarahi setiap keystroke.
- Read-only terlihat berbeda dari disabled dan tetap dapat disalin.

### Status badge

- Ikon 14px + label 12–13px semibold.
- Background tint lembut; text/icon memakai warna yang lolos kontras.
- Tidak boleh menjadi satu-satunya tempat timestamp ditampilkan.

### Metric card

- Label, angka + unit, trend/status, timestamp.
- Angka memakai tabular figures.
- Skeleton harus mempertahankan dimensi agar tidak terjadi layout shift.
- `—` berarti tidak ada data; jangan mengubahnya menjadi `0`.

### Table

- Header sticky hanya bila tidak menutupi focused row.
- Row 48px default; cell padding 12px 16px.
- Teks kiri, angka kanan, status tengah/kiri, actions kanan.
- Sort button memakai `aria-sort`.
- Empty, loading, error, dan filtered-empty adalah empat state berbeda.
- Pagination server-side; tampilkan range dan total.

### Dialog

- Konfirmasi sederhana maksimal 420px.
- Judul menyebut aksi dan objek: “Aktifkan maintenance untuk AQ-102?”
- Jelaskan akibat sebelum tombol konfirmasi.
- Destructive action tidak menjadi default focused button.
- Escape, close button, dan focus return ke trigger wajib bekerja.

### Toast dan alert

- Toast success 3–5 detik, `aria-live="polite"`, tidak mengambil focus.
- Error yang perlu recovery menetap dekat konteks dan menyediakan retry.
- Alert kritis tidak auto-dismiss.

### Context selector

- Urutan selalu Tambak → Kolam → Device → Periode.
- Opsi downstream di-reset saat parent berubah dan perubahan diumumkan melalui status region yang sesuai.
- Label lengkap tetap tersedia; placeholder bukan pengganti label.
- Loading opsi tidak membuat selector seolah kosong atau dapat dipilih.

### Activity shortcut

- Bentuk icon + label, tinggi minimum 44px, dan active state yang jelas.
- Maksimal 5 shortcut utama per konteks; sisanya masuk menu **Lainnya** hanya bila benar-benar ada.
- Shortcut adalah navigasi/aksi cepat, bukan tab semu untuk konten yang tidak saling terkait.

### Stepper

- Menampilkan step aktif, selesai, dan belum tersedia dengan teks/ikon selain warna.
- User dapat kembali ke step selesai; lompat ke step belum valid dibatasi dengan alasan yang jelas.
- Mobile memakai label ringkas seperti “Langkah 2 dari 4 — Informasi Kolam” agar tidak memaksa empat label berjajar sempit.

## 10. Monitoring dan chart

- Current value tetap terlihat di luar chart.
- Line chart untuk tren waktu; area tipis maksimal 10–15% opacity.
- Maksimal enam series hanya untuk overview; default detail satu atau dua parameter agar terbaca.
- Threshold memakai dashed line/band dan label nilai.
- Anomaly memakai marker berbeda + anotasi, bukan merah saja.
- Jika prediksi tersedia, aktual memakai garis solid, prediksi garis putus-putus, dan target berupa band/garis berlabel.
- Tooltip dapat diakses keyboard dan menampilkan timestamp, nilai, dan unit.
- Sediakan tabel data dan ringkasan tekstual untuk screen reader.
- Data ≥1.000 titik perlu agregasi/downsampling; jangan render semua titik tanpa alasan.
- Tampilkan tombol **Pause updates**, **Resume**, dan **Refresh sekarang** pada view polling.
- Saat `prefers-reduced-motion`, chart langsung ke state akhir tanpa entrance animation.

Format unit:

| Parameter | Label | Unit |
|---|---|---|
| `suhu` | Suhu | °C |
| `ph` | pH | tanpa unit |
| `do` | Dissolved Oxygen | mg/L |
| `tds` | TDS | ppm |
| `ammonia` | Amonia | mg/L |
| `salinitas` | Salinitas | ppt |

## 11. State halaman

Setiap layar data harus merancang:

- **Loading:** skeleton lokal, bukan spinner full-screen untuk refresh rutin.
- **Success:** timestamp update terlihat.
- **Empty:** jelaskan sebab dan satu next action.
- **Filtered empty:** “Tidak ada hasil untuk filter ini” + reset filter.
- **Stale:** data lama tetap tampil dengan warning dan timestamp; jangan blank.
- **Offline:** data terakhir tetap tampil, jelas bahwa itu bukan live.
- **Error:** ringkas penyebab yang aman + retry.
- **Forbidden:** jelaskan bahwa akun tidak memiliki akses; jangan mengarahkan diam-diam.
- **Estimated/predicted:** selalu tampilkan label, confidence, provenance, dan waktu kalkulasi; tidak boleh terlihat sama dengan telemetry aktual.

## 12. Motion

- Hover/focus color: 120–160ms.
- Drawer/modal: 180–240ms.
- Chart transition: 200–300ms bila membantu memahami perubahan.
- Animasikan `transform` dan `opacity`, bukan width/height/top/left.
- Maksimal 1–2 elemen bergerak penting per view.
- Semua motion non-esensial berhenti pada `prefers-reduced-motion: reduce`.
- Polling tidak boleh membuat card/row melompat atau focus berpindah.

Tidak perlu GSAP untuk dashboard MVP; CSS transition dan kemampuan chart library sudah cukup.

## 13. Voice dan microcopy

Karakter: jelas, tenang, membantu. Gunakan Bahasa Indonesia sebagai default dan istilah teknis konsisten.

| Hindari | Gunakan |
|---|---|
| “Error!” | “Data belum dapat dimuat.” |
| “Invalid input” | “Interval harus antara 1–60 menit.” |
| “Device mati” | “Device offline. Terakhir terlihat 14:32.” |
| “Success” | “Device ID berhasil ditambahkan.” |
| “Apakah Anda yakin?” | “Lepaskan AQ-102 dari Budi? Histori tetap disimpan.” |

- Gunakan “Device” secara konsisten di web; jangan mencampur “Divais”, “Perangkat”, dan “Device” pada level UI yang sama.
- Label button berbentuk kata kerja: Tambah device, Simpan perubahan, Ekspor CSV.
- Jangan klaim real-time bila update berbasis polling/menit; gunakan “Terakhir diperbarui”.

## 14. Accessibility

- Target WCAG 2.2 AA.
- Normal text minimum 4.5:1; large text dan UI boundary minimum 3:1.
- Semua fungsi dapat dipakai keyboard; urutan tab mengikuti visual.
- Focus ring 2px + offset 2px dan tidak dihapus.
- Route change memindahkan focus ke main heading.
- Skip link menuju main content.
- Icon-only button memiliki accessible name; decorative icon disembunyikan dari accessibility tree.
- Status tidak bergantung pada warna.
- Form error summary menerima focus pada submit gagal dan menaut ke field.
- Sticky header/toast/modal tidak menutupi focused element.
- Browser zoom 200% dan text reflow tidak memicu kehilangan fungsi.
- Authentication mendukung paste dan password manager.

## 15. Checklist handoff

- [ ] Logo resmi, proporsi, clear space, dan background sesuai.
- [ ] Inter dipakai dari asset lokal atau system fallback; tidak ada font tambahan tanpa alasan.
- [ ] Semua warna komponen berasal dari semantic token.
- [ ] Primitive, semantic, dan component token tidak dilewati dengan raw value di komponen.
- [ ] User dan admin berbagi component system tetapi menerima menu sesuai role.
- [ ] User view mempertahankan konteks Tambak/Kolam/Device; admin view mengutamakan fleet filter dan exception.
- [ ] Connectivity dan operational mode tidak digabung.
- [ ] Semua nilai sensor memiliki unit, timestamp, serta missing-data state.
- [ ] Chart memiliki summary dan table alternative.
- [ ] Search/filter/sort/pagination dapat digunakan keyboard dan tersimpan di URL.
- [ ] Loading, empty, stale, offline, error, forbidden, dan success sudah didesain.
- [ ] Viewport 375, 768, 1024, dan 1440 telah diuji.
- [ ] Reduced motion, 200% zoom, contrast, dan screen reader labels telah diuji.
- [ ] Tidak ada shared admin API key atau secret lain di frontend.
- [ ] Pola referensi hanya diadaptasi; tidak ada logo, ilustrasi, copy, atau layout pixel-for-pixel milik produk lain.
- [ ] Sampling/prediksi tidak tampil sebagai fitur aktif sebelum kontrak data, provenance, dan state aktual-vs-estimasi tersedia.
