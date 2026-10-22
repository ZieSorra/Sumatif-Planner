# Sumatif Planner — Review Teknis Draf Skema SQL

Status: hasil review statis dokumen saja. Tidak ada SQL yang dijalankan, tidak ada koneksi database, dan tidak ada perubahan source code aplikasi.

Dokumen yang ditinjau:
- `docs/DATA_CONTRACT_V1.md`
- `docs/COMPATIBILITY_AUDIT.md`
- `docs/SQL_SCHEMA_DRAFT_REVIEW_ONLY.sql`
- `src/domain.js` sebagai referensi perilaku saat ini

## Ringkasan

Draf sudah mengarah ke struktur yang mendukung identitas rombel lintas tahun, riwayat jadwal, Supabase Auth, dan akses guru read-only. Namun, draf **belum boleh dijadikan migrasi yang dapat dijalankan** karena beberapa detail kontrak dan validasi perlu disejajarkan terlebih dahulu.

## Temuan yang perlu diselesaikan

### 1. Identitas rombel dan tingkat kelas
- Keputusan pemilik proyek: ID rombel tetap lintas tahun ajaran.
- Draf SQL memperkenalkan `classes` dan `class_years`, sedangkan kontrak data v1.3 masih menempatkan `name` dan `grade_level` langsung pada `classes`.
- Tindakan sebelum migrasi: selaraskan kontrak data dengan model `class_years`, agar nama/tingkat rombel tersimpan per tahun ajaran dan laporan lama tidak berubah.
- Tidak mengubah aturan sekolah; ini pembaruan struktur data.

### 2. Cakupan kuota harus cocok persis dengan domain saat ini
- `src/domain.js` menghitung jadwal konflik dengan tahun ajaran, semester, kelas, dan tanggal yang sama.
- Catatan fungsi transaksi di draf SQL menyebut `class_year_id + assessment_date` sebagai kunci serialisasi.
- Tindakan: kunci transaksi dan semua query hitung harus memasukkan konteks semester juga, atau menunjukkan alasan bahwa semester sudah ditentukan unik oleh class_year/date. Pilihan paling aman untuk kompatibilitas adalah menggunakan `academic_year_id + semester + class_year_id + assessment_date`.
- Tetap pertahankan batas yang ada: maksimal 2 tertulis; jika ada praktik, maksimal 3 total; cancelled tidak dihitung; benturan waktu hanya peringatan.

### 3. Validasi penugasan guru
- Domain saat ini mencocokkan penugasan aktif berdasarkan guru, kelas, mapel, dan tahun ajaran. Semester jadwal juga divalidasi sebagai 1 atau 2, tetapi contoh data penugasan demo tidak menyimpan semester.
- Draf SQL menambahkan semester pada `teacher_assignments`.
- Tindakan: sebelum implementasi, pastikan sumber aturan lama memang menetapkan penugasan per semester. Jangan menambah batasan baru tanpa konfirmasi; jika semester hanya metadata jadwal, aturan assignment harus disesuaikan agar tidak menolak jadwal valid yang sebelumnya diterima.

### 4. Otorisasi dan RLS
- Draf masih berupa outline, bukan kebijakan lengkap.
- Sebelum migrasi: definisikan policy SELECT untuk admin/guru, larangan mutasi jadwal oleh guru, pengelolaan data referensi oleh admin, serta perlindungan perubahan role profile.
- Uji setidaknya: anonymous, admin, guru dengan penugasan aktif, guru tanpa penugasan, dan guru dengan penugasan tidak aktif.
- Jangan memberikan hak UPDATE pada tabel `profiles.role` kepada pemilik profil itu sendiri.

### 5. Pembatalan dan nomor sumatif
- Domain memeriksa duplikasi nomor sumatif hanya terhadap jadwal aktif dan mempertahankan record cancelled.
- Partial unique index pada draf sejalan dengan perilaku tersebut.
- Sebelum implementasi, uji transisi scheduled → cancelled, pemakaian ulang nomor setelah pembatalan, dan kegagalan pembatalan tanpa hak admin.
- Jangan hard-delete jadwal.

### 6. Konsistensi data dan validasi tambahan
- Draf menggunakan foreign key untuk menjaga relasi dan CHECK untuk semester, nomor sumatif, serta urutan waktu.
- Perlu dipastikan fungsi penulisan juga memvalidasi kalender sekolah dan assignment aktif dalam transaksi yang sama, termasuk saat jadwal diedit.
- Waktu bentrok tidak boleh menggagalkan transaksi.
- Kolom `updated_at` memerlukan mekanisme update yang konsisten jika UI mengandalkan nilainya.
- Constraint `cancellation_metadata_check` saat ini mengizinkan status cancelled tanpa metadata pembatalan. Ini dapat diperlukan untuk data historis; bila diwajibkan untuk data baru, enforce di fungsi pembatalan, bukan dengan merusak kompatibilitas riwayat lama.

## Gerbang sebelum migrasi

1. Selaraskan `DATA_CONTRACT_V1.md` dengan `classes + class_years`.
2. Tegaskan cakupan assignment terhadap semester berdasarkan aturan yang sudah ada.
3. Perinci fungsi transaksi kuota dan kebijakan RLS.
4. Buat rencana pemetaan data lama ke struktur baru; jangan mengarang ID atau menghapus riwayat.
5. Uji draf di database pengembangan kosong dan database salinan yang aman, bukan produksi.
6. Minta persetujuan final sebelum mengubah draf komentar menjadi SQL yang dapat dieksekusi.

## Batasan

Review ini dilakukan dengan membaca file repository saja. Tidak ada schema Supabase target yang dibaca, jadi belum dapat dipastikan apakah tabel atau nama kolom yang diusulkan berbenturan dengan schema yang sudah ada.
