# Monitoring harian

Mode: Operate. Routes: /admin/monitoring dan /app/monitoring.

## Direction contract

THESIS: Satu ruang kerja untuk memilih perangkat, membaca nilainya, dan menelusuri grafik; tabel fleet tidak mendahului grafik.

OWN-WORLD: Sidebar biru Aquanotes, permukaan putih pada latar biru dingin, teks navy, biru untuk pilihan aktif. Warna status memiliki label eksplisit. Font UI existing, angka tabular, radius 12px, garis pemisah ringan.

STORY: Pengguna mencari perangkat atau lokasi, memilih parameter lewat nilai terbaru, dan langsung membaca tren serta waktu pengukuran. Detail seluruh fleet tersedia melalui disclosure di bawah ruang kerja.

FIRST VIEWPORT: Header kompak; navigator perangkat selebar 248px di kiri; identitas, enam pemilih parameter berikon, dan grafik dominan di kanan. Pada ponsel navigator menjadi select, nilai menjadi tiga kolom, identitas yang sama tidak diulang. Status stale ringkas dan jumlah sensor terbaca tetap terlihat; timestamp lengkap tersedia pada detail pengukuran.

FORM: Struktur operasional dipatok oleh permintaan pengguna dan konfirmasi monitoring harian; gunakan kontrol web standar.

FINISH: Perpindahan perangkat mempertahankan posisi grafik, parameter aktif memiliki isi biru dan aria-pressed. Grafik memakai kurva monotone-X, reveal dan transisi data 750ms ease-out, serta crossfade saat konteks berubah. Semua motion menghormati reduced motion; celah null tetap terputus dan nilai asli tetap tersedia. Lebar 320/360px wajib tidak memiliki page overflow. Navigasi cepat bawah memudahkan penggunaan mobile.

HISTORY: Status parameter terkini terpisah dari histori. Tile bernilai null tetap bertanda “Tidak tersedia”; grafik berjudul Riwayat dapat mengambil jendela terakhir yang memiliki nilai, dengan timestamp asli, celah null, serta kontrol Lebih lama/Riwayat terbaru. Jangan menyalin pembacaan lama ke nilai terkini. Pengguna hanya dapat melihat histori assignment miliknya; admin dapat memeriksa seluruh histori perangkat.

ALARMS: Menu Alarm → Atur alarm membuka /app/alerts/settings. Pilih perangkat milik akun, aktifkan parameter yang perlu diawasi, isi minimum/maksimum yang didukung backend, lalu simpan secara eksplisit. Off mengirim null; 0 tetap nilai valid. Pengaturan berlaku untuk alarm backend/mobile yang sama, bukan salinan preferensi browser.
