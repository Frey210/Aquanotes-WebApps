# Mobile dashboard v2 — 17 Oktober 2026

Memperbaiki keluhan overflow /admin pada viewport 360px serta hierarki yang terlalu kaku dan padat teks.

## Perubahan

- Root penyebab overflow: grid `.page` memakai automatic minimum track mengikuti lebar intrinsik tabel. Gunakan `minmax(0, 1fr)` dan shrinkable children, tanpa menyembunyikan overflow body.
- Ringkasan admin/pengguna memakai diagram status dari hitungan API dan daftar prioritas empat perangkat. Daftar lengkap tetap pada halaman perangkat.
- Status perawatan/nonaktif pengguna tidak diklasifikasikan sebagai offline.
- Sensor menjadi tile berikon; nilai kosong berupa em dash, nilai nol tetap valid, high/low tetap memiliki badge visual. Detail waktu tersimpan pada tabel pengukuran.
- Navigasi bawah mobile dan menu dengan focus trap, focus return, Escape, dan inert saat tersembunyi.
- Transisi route 260ms, drawer 260ms, grafik 220ms. Hormati reduced motion; tidak menambah dependency.

## Verifikasi

Build TypeScript/Vite, tiga test telemetry/status, dua browser suites dengan 20 kombinasi role/viewport, termasuk 320/360/390px, pencarian/perpindahan sensor, nilai nol/null, gap data, batas tinggi/rendah, status perawatan/nonaktif, focus trap, dan reduced motion.

Production smoke meliputi /admin, monitoring, perangkat, pengguna, firmware, dan profil pada 360px dan desktop. Tidak membuat/menghapus/memindahkan perangkat atau mengubah data sensor.

## Deployment dan rollback

Image baru: `aquanotes-web:20261017-mobile-v2`.
Rollback: `aquanotes-web:20261017-monitoring-workspace`.

Gunakan artifact `dist` lokal dengan Dockerfile.artifact. Uji image dahulu pada port staging internal; kemudian ganti service web saja.

```sh
WEB_IMAGE=aquanotes-web:20261017-mobile-v2 \
  docker compose -p stage2 -f deployment/compose.web.yml up -d --no-deps web
```

Rollback dari direktori release yang sama:

```sh
WEB_IMAGE=aquanotes-web:20261017-monitoring-workspace \
  docker compose -p stage2 -f deployment/compose.web.yml up -d --no-deps web
```

API, database, broker, dan firmware tidak membutuhkan perubahan.
