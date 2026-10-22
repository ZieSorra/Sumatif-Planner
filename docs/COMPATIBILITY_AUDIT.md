# Sumatif Planner — Audit Kompatibilitas Pembaruan

Status: pemeriksaan dokumentasi Fase 2. Tidak mengubah kode aplikasi, aturan bisnis, atau database.
Tujuan: memastikan integrasi berikutnya memperbarui penyimpanan tanpa mengubah perilaku Sumatif Planner yang sudah ada.

## Acuan yang diperiksa

- `src/domain.js`: definisi data demo, status, validasi, kuota, nomor sumatif, dan peringatan benturan.
- `src/store.js`: operasi baca, validasi, simpan, batal, dan reset store dalam memori.
- `README.md`: batasan prototipe dan status integrasi.

## Perilaku saat ini yang wajib dipertahankan

| Area | Perilaku yang ada | Persyaratan kompatibilitas |
|---|---|---|
| Tahun ajaran | Jadwal menyimpan tahun ajaran; demo konteks 2026/2027 | Data jadwal lama tetap terkait tahun ajaran asal |
| Semester | Hanya 1 atau 2 | Jangan mengubah validasi semester |
| Kelas | Demo hanya kelas SD tingkat 1–6; setiap ID demo saat ini membawa konteks tahun ajaran | ID rombel harus tetap lintas tahun ajaran sesuai keputusan pemilik; migrasi perlu memisahkan identitas rombel dari tahun ajaran tanpa menghilangkan hubungan jadwal lama |
| Penugasan guru | Jadwal divalidasi terhadap penugasan aktif untuk guru, kelas, mapel, dan tahun ajaran | Hak akses dan validasi penugasan harus menggunakan data penugasan aktif |
| Nomor sumatif | Kode domain menerima nomor 1–3; duplikasi diperiksa untuk jadwal aktif dalam tahun ajaran, semester, kelas, dan mapel yang sama | Pertahankan rentang dan perilaku duplikasi yang ada; jadwal batal tetap menjadi riwayat |
| Jenis asesmen | `written` atau `practical` | Pertahankan nilai status dan tipe yang sudah dipakai atau sediakan pemetaan migrasi eksplisit |
| Kuota tertulis | Maksimal 2 asesmen tertulis aktif per kelas/tanggal | Jadwal batal tidak dihitung |
| Kuota total | Jika ada praktik aktif, maksimal 3 asesmen aktif per kelas/tanggal | Terapkan di backend/database secara transaksional tanpa mengubah hasil yang diharapkan |
| Kalender sekolah | Tanggal yang ditandai tidak dapat dipilih akan ditolak | Data event dan tanggal blokir harus dipertahankan |
| Waktu | Format HH:MM, waktu selesai harus setelah mulai | Pertahankan validasi |
| Benturan waktu | Menghasilkan warning, bukan error validasi | Jangan mengubah warning menjadi blokir |
| Pembatalan | Status berubah menjadi `cancelled`; record tidak dihapus | Simpan status, aktor, dan waktu pembatalan |
| Dashboard | Ringkasan menghitung jadwal aktif; jadwal batal terpisah | Nilai dashboard harus konsisten dengan jadwal tersimpan |
| Penyimpanan saat ini | Store hanya di memori; refresh menghapus perubahan | Integrasi persisten harus menambah daya simpan tanpa merusak kontrak fungsi layar |

## Ketentuan akses yang sudah dikonfirmasi

- Autentikasi memakai Supabase Auth.
- Guru hanya boleh melihat jadwal yang sesuai dengan penugasan kelas/mapel aktif miliknya.
- Hanya admin yang boleh membuat perubahan jadwal, mengedit, dan membatalkan sesuai ketentuan akses yang telah disepakati.
- Peran dan otorisasi harus ditegakkan pada backend/database, bukan hanya melalui UI.
- RLS harus diuji untuk setiap tabel yang terekspos ke klien.

## Risiko integrasi yang perlu ditangani

1. **Identitas rombel:** model demo saat ini menyimpan `academicYear` pada objek kelas. Kontrak final menyatakan ID rombel tetap lintas tahun. Migrasi perlu menormalkan hubungan tanpa mengganti ID jadwal atau menghilangkan riwayat.
2. **Aturan kuota saat konkurensi:** validasi frontend tidak cukup; operasi database harus atomik atau menggunakan mekanisme locking yang teruji.
3. **Riwayat pembatalan:** jangan menghapus record atau menghitung jadwal batal sebagai jadwal aktif.
4. **Nomor sumatif:** implementasi duplikasi mengabaikan record cancelled. Kendala database harus mencerminkan hal ini.
5. **Peringatan benturan:** harus tetap dapat disimpan setelah warning ditampilkan.
6. **Sumber data lintas layar:** dashboard, kalender, form, dan laporan harus membaca sumber data persisten yang sama setelah integrasi.
7. **Otorisasi admin:** karena guru read-only untuk jadwal, operasi perubahan harus ditolak di sisi database/API bagi pengguna non-admin.
8. **Kerahasiaan:** kredensial Supabase service-role tidak boleh masuk frontend atau repository.

## Yang tidak termasuk dalam langkah ini

- Tidak ada migrasi SQL.
- Tidak ada koneksi atau penulisan ke Supabase.
- Tidak ada perubahan pada source code aplikasi.
- Tidak ada deployment.
- Tidak ada perubahan aturan bisnis baru.

## Gerbang sebelum migrasi

Sebelum membuat migrasi, tinjau kontrak data dan pastikan setiap constraint, index, fungsi, serta policy RLS memiliki keterkaitan langsung dengan perilaku yang tercatat di atas. Jika sebuah constraint akan mengubah perilaku lama, hentikan dan minta persetujuan terlebih dahulu.
