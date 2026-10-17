# Ringkasan admin dan pengguna

Mode: Operate. Routes: /admin dan /app.

## Direction contract

THESIS: Menampilkan kondisi fleet secara visual lalu prioritas singkat, menggantikan empat KPI panjang dan tabel yang membuat halaman mobile melebar.

OWN-WORLD: Biru Aquanotes mengikat diagram konektivitas dengan legenda eksplisit; aktivitas menggunakan tints biru, amber, violet, dan slate. Logo Aquanotes dan endorsement Aerasea dipertahankan.

STORY: Pengguna memeriksa koneksi, membuka monitoring lewat satu tombol, atau memilih perangkat yang perlu perhatian. Ringkasan hanya menampilkan empat perangkat; daftar lengkap tetap tersedia pada halaman perangkat.

FIRST VIEWPORT: Desktop menempatkan konektivitas di kiri dan aktivitas di kanan. Mobile menumpuk diagram kompak, dua kolom aktivitas, lalu daftar prioritas tanpa tabel. Navigasi bawah menampilkan Ringkasan, Monitoring, Perangkat, dan Menu.

FORM: Diagram distribusi memakai hitungan API sebenarnya, bukan progress dekoratif. Tidak ada angka simulasi dalam aplikasi production.

FINISH: Grid minmax(0, 1fr) mengizinkan konten menyusut; tidak ada overflow-x hidden pada body yang menyamarkan bug. Transisi route 260ms dan drawer 260ms, dinonaktifkan pada reduced motion.
