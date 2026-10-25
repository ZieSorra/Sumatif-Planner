# Sumatif Planner

Aplikasi perencana asesmen sumatif untuk sekolah dasar (SD), dikembangkan di bawah payung ZIESORRA.

## Status proyek

Branch integrasi Supabase tersedia sebagai kandidat uji. Jika konfigurasi Supabase belum diisi di `index.html`, aplikasi tetap berjalan dalam mode demo. Koneksi database langsung belum diverifikasi terhadap proyek Supabase sekolah; jangan gunakan data nyata sebelum uji RLS, trigger, dan operasi jadwal selesai.

## Cakupan saat ini

- Shell responsif dengan navigasi Dashboard, Kalender, Form & Validasi, serta Laporan.
- Kontrak domain dan data demo untuk tahun pelajaran 2026/2027.
- Validasi kuota asesmen harian: maksimal 2 asesmen tertulis per kelas per hari; bila ada asesmen praktik, maksimal 3 asesmen aktif total per kelas per hari.
- Status jadwal tersimpan menggunakan `scheduled` atau `cancelled`.
- Store demo lintas layar melalui bridge `postMessage`.
- Mode Supabase opsional melalui browser client, login, adapter repository, dan bridge async saat runtime config diisi.
- Form Supabase mengambil referensi dari tabel yang ada dan mengirim UUID database.

## Menjalankan secara lokal

Dibutuhkan Node.js 20+.

```bash
npm test
npm run check:structure
```

Untuk membuka UI, sajikan direktori ini lewat server HTTP lokal. Jangan membuka `index.html` langsung melalui `file://` karena bridge antar-frame mensyaratkan origin yang sama.

## Batasan dan keamanan

- Mode demo: semua data dan perubahan berada di memori; refresh mengembalikan data awal.
- Mode Supabase: koneksi memerlukan URL proyek dan publishable/anon key pada `supabase-url` dan `supabase-publishable-key` di `index.html`; jangan pernah memasukkan `service_role` key.
- Login bergantung pada akun Supabase Auth dan baris profil aktif di tabel `profiles`.
- Operasi database belum diuji terhadap proyek nyata. RLS adalah batas keamanan utama; kebijakan DELETE yang dilaporkan masih mengizinkan guru menghapus baris miliknya dan harus diselaraskan sebelum produksi.
- Pembatalan menjalankan trigger UPDATE yang ada; uji perilakunya sebelum digunakan.
- Commit ini tidak melakukan deployment.


## Database planning

Draft data contract (not yet applied to any database): [docs/DATA_CONTRACT_V1.md](docs/DATA_CONTRACT_V1.md). Compatibility audit for preserving existing rules: [docs/COMPATIBILITY_AUDIT.md](docs/COMPATIBILITY_AUDIT.md). No database migration or production write is authorized yet. SQL schema draft for review only (not executable/applied): [docs/SQL_SCHEMA_DRAFT_REVIEW_ONLY.sql](docs/SQL_SCHEMA_DRAFT_REVIEW_ONLY.sql).

SQL draft review findings (static review only; no database access): [docs/SQL_SCHEMA_REVIEW.md](docs/SQL_SCHEMA_REVIEW.md).

Supabase schema inventory (SELECT-only; not executed): [docs/SUPABASE_READ_ONLY_INSPECTION.sql](docs/SUPABASE_READ_ONLY_INSPECTION.sql).
