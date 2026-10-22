# Sumatif Planner

Aplikasi perencana asesmen sumatif untuk sekolah dasar (SD), dikembangkan di bawah payung ZIESORRA.

## Status proyek

Fondasi Fase 2 masih berupa prototipe frontend dengan store dalam memori sesi. Belum terhubung ke Supabase dan belum menyimpan perubahan secara permanen. Jangan gunakan sebagai aplikasi produksi sebelum integrasi dan pengujian browser selesai.

## Cakupan saat ini

- Shell responsif dengan navigasi Dashboard, Kalender, Form & Validasi, serta Laporan.
- Kontrak domain dan data demo untuk tahun pelajaran 2026/2027.
- Validasi kuota asesmen harian: maksimal 2 asesmen tertulis per kelas per hari; bila ada asesmen praktik, maksimal 3 asesmen aktif total per kelas per hari.
- Status jadwal tersimpan menggunakan `scheduled` atau `cancelled`.
- Store sementara lintas layar melalui bridge `postMessage`.

## Menjalankan secara lokal

Dibutuhkan Node.js 20+.

```bash
npm test
npm run check:structure
```

Untuk membuka UI, sajikan direktori ini lewat server HTTP lokal. Jangan membuka `index.html` langsung melalui `file://` karena bridge antar-frame mensyaratkan origin yang sama.

## Batasan dan keamanan

- Semua data demo dan perubahan jadwal ada di memori; refresh halaman akan menghapus perubahan.
- Tidak ada koneksi Supabase atau penulisan database produksi.
- Belum ada autentikasi aplikasi yang siap produksi; jangan gunakan data pribadi siswa.
- Commit ini tidak melakukan deployment.
