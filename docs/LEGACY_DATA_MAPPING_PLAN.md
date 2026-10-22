# Rencana Pemetaan Data Lama — Sumatif Planner

**Status:** draf pemeriksaan; tidak menjalankan SQL, tidak membaca atau menulis Supabase, tidak melakukan deployment.

## Tujuan
Memetakan data Sumatif Planner yang sudah ada ke rancangan `classes + class_years` dan Supabase Auth tanpa mengubah ketentuan lama atau kehilangan riwayat.

## Inventaris sebelum pemetaan
Lakukan pemeriksaan **read-only** pada database target setelah akses dan lingkupnya disetujui:
- Nama tabel, kolom, tipe data, foreign key, indeks, RLS, dan fungsi yang sudah ada.
- Jumlah baris per tabel, tahun ajaran, rombel, penugasan, jadwal aktif dan batal.
- Apakah identitas kelas/rombel sudah stabil lintas tahun ajaran.
- Apakah penugasan guru saat ini berbasis semester.
- Hubungan identitas guru dengan `auth.users` atau tabel profil yang sudah ada.

**Jangan** menyimpulkan database kosong hanya karena repositori saat ini memakai demo in-memory.

## Matriks pemetaan yang direncanakan

| Sumber logis | Target rancangan | Prinsip |
|---|---|---|
| Tahun ajaran | academic_years | Pertahankan ID dan periode jika sudah ada |
| Identitas rombel | classes | ID rombel tetap; jangan buat ulang tiap tahun |
| Label/tingkat rombel per tahun | class_years | Buat pasangan unik (rombel, tahun ajaran); jaga label historis |
| Guru dan admin | profiles / auth.users | Gunakan identitas Supabase Auth yang sah; jangan buat akun atau menebak UUID |
| Mata pelajaran | subjects | Pertahankan identitas/kode yang sudah dipakai |
| Penugasan guru | teacher_assignments | Cocokkan tahun ajaran, rombel, mapel, guru; semester hanya bila memang aturan lama |
| Kalender sekolah | school_calendar_events | Pertahankan tanggal dan sifat blokir |
| Jadwal sumatif | assessment_schedules | Pertahankan ID, status, tipe, waktu, dan nomor sumatif |
| Jadwal dibatalkan | assessment_schedules.status=cancelled | Jangan dihapus; metadata historis boleh tetap null jika sumber tidak punya |

## Pemeriksaan kompatibilitas wajib
1. Tidak ada jadwal tanpa tahun ajaran, kelas, mata pelajaran, atau guru yang dapat dipetakan.
2. Jumlah jadwal aktif dan batal sebelum/sesudah pemetaan sama.
3. Tidak ada ID jadwal yang hilang atau berubah tanpa rencana yang disetujui.
4. Tidak ada duplikasi nomor sumatif **aktif** pada kombinasi tahun ajaran + semester + rombel + mapel.
5. Kuota menghitung jadwal aktif per tahun ajaran + semester + kelas + tanggal: maksimal 2 tertulis; jika ada praktik, maksimal 3 total.
6. Jadwal yang sudah batal tidak dihitung sebagai aktif.
7. Benturan waktu hanya menghasilkan peringatan.
8. Hak akses: admin mengubah; guru membaca jadwal sesuai penugasan aktif; pengguna anonim tidak mendapat akses.
9. Identitas kelas historis tidak berubah saat label kelas di tahun baru diperbarui.
10. Uji permintaan bersamaan untuk memastikan kuota tidak terlampaui.

## Urutan implementasi kelak (setelah persetujuan eksplisit)
1. Inventaris skema target read-only dan buat backup terverifikasi.
2. Susun tabel mapping ID lama-ke-baru dan daftar konflik untuk diselesaikan.
3. Uji di lingkungan pengembangan terisolasi menggunakan salinan data yang aman.
4. Uji integritas, RLS, transaksi, dan regresi antarlayar.
5. Siapkan rollback serta prosedur pemulihan.
6. Ajukan hasil dan minta persetujuan final sebelum perubahan produksi.

## Keputusan teknis yang tidak boleh diasumsikan
- Struktur aktual Supabase target dan apakah tabel sudah tersedia.
- Apakah penugasan lama berlaku per semester.
- Apakah metadata pembatalan tersedia pada data historis.
- Apakah ID guru saat ini sama dengan `auth.users.id`.

Dokumen ini adalah rencana, bukan perintah migrasi.
