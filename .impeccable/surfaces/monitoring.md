# Monitoring harian

Mode: Operate. Routes: /admin/monitoring dan /app/monitoring.

## Direction contract

THESIS: Satu ruang kerja untuk memilih perangkat, membaca nilainya, dan menelusuri grafik; tabel fleet tidak mendahului grafik.

OWN-WORLD: Sidebar biru Aquanotes, permukaan putih pada latar biru dingin, teks navy, biru untuk pilihan aktif. Warna status memiliki label eksplisit. Font UI existing, angka tabular, radius 12px, garis pemisah ringan.

STORY: Pengguna mencari perangkat atau lokasi, memilih parameter lewat nilai terbaru, dan langsung membaca tren serta waktu pengukuran. Detail seluruh fleet tersedia melalui disclosure di bawah ruang kerja.

FIRST VIEWPORT: Header kompak; navigator perangkat selebar 248px di kiri; identitas, enam pemilih parameter berikon, dan grafik dominan di kanan. Pada ponsel navigator menjadi select, nilai menjadi tiga kolom, identitas yang sama tidak diulang. Status stale ringkas dan jumlah sensor terbaca tetap terlihat; timestamp lengkap tersedia pada detail pengukuran.

FORM: Struktur operasional dipatok oleh permintaan pengguna dan konfirmasi monitoring harian; gunakan kontrol web standar.

FINISH: Perpindahan perangkat mempertahankan posisi grafik, parameter aktif memiliki isi biru dan aria-pressed. Grafik crossfade saat konteks berubah, halaman memiliki transisi masuk, dan semua motion menghormati reduced motion. Lebar 320/360px wajib tidak memiliki page overflow. Navigasi cepat bawah memudahkan penggunaan mobile.
