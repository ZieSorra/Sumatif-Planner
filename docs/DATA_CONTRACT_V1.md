# Sumatif Planner — Kontrak Data v1 (Draft)

Status: DRAFT untuk review, belum diterapkan ke database.
Tujuan: menyepakati entitas, relasi, batasan bisnis, dan akses sebelum integrasi database.
Sumber kebenaran: kebutuhan dan aturan yang sudah diimplementasikan pada prototipe. Detail yang belum diputuskan ditandai OPEN QUESTION.

## 1. Prinsip

- Semua jadwal terikat pada tahun ajaran, semester, kelas, mata pelajaran, dan guru.
- Status jadwal hanya `scheduled` atau `cancelled`; pembatalan mempertahankan riwayat.
- Batas harian diterapkan per kelas dan tanggal: maksimum 2 asesmen tertulis; jika ada asesmen praktik, maksimum 3 asesmen aktif total.
- Jadwal berstatus `cancelled` tidak dihitung terhadap kuota.
- Waktu disimpan sebagai waktu lokal sekolah; zona waktu yang disarankan untuk tampilan adalah Asia/Jakarta.
- Kontrak ini tidak menyertakan kredensial atau data peserta didik.

## 2. Entitas inti

### academic_years
- id: UUID, primary key
- name: string, unique (contoh format: 2026/2027)
- starts_on: date
- ends_on: date
- is_active: boolean
- created_at, updated_at: timestamptz

Aturan:
- starts_on harus <= ends_on.
- Sebaiknya hanya satu tahun ajaran aktif pada satu waktu (perlu diputuskan apakah ditegakkan di database).

### classes
- id: UUID, primary key
- name: string (mis. 5-A)
- grade_level: integer, dibatasi 1–6
- is_active: boolean
- created_at, updated_at: timestamptz

Catatan:
- Jika nama kelas berulang setiap tahun, identitas kelas perlu diikat ke tahun ajaran atau dimodelkan sebagai rombel tetap + enrollment tahunan. Ini OPEN QUESTION.

### subjects
- id: UUID, primary key
- name: string
- code: string, unique bila kode resmi tersedia
- is_active: boolean
- created_at, updated_at: timestamptz

### teachers
- id: UUID, primary key
- display_name: string
- auth_user_id: UUID nullable, unique, referensi identitas autentikasi jika sistem autentikasi dipilih
- is_active: boolean
- created_at, updated_at: timestamptz

### teacher_assignments
- id: UUID, primary key
- academic_year_id: UUID, FK -> academic_years
- class_id: UUID, FK -> classes
- subject_id: UUID, FK -> subjects
- teacher_id: UUID, FK -> teachers
- semester: smallint, hanya 1 atau 2
- is_active: boolean
- created_at, updated_at: timestamptz

Aturan:
- Jadwal hanya valid jika terdapat penugasan aktif yang cocok dengan tahun ajaran + semester + kelas + mata pelajaran + guru.
- Perlu diputuskan apakah kombinasi kelas + mata pelajaran + semester boleh memiliki lebih dari satu guru.

### school_calendar_events
- id: UUID, primary key
- academic_year_id: UUID, FK -> academic_years
- event_date: date
- title: string
- blocks_assessments: boolean, default true
- created_at, updated_at: timestamptz

Aturan:
- Jadwal tidak boleh dibuat pada tanggal yang diblokir oleh event dengan blocks_assessments=true.

### assessment_schedules
- id: UUID, primary key
- academic_year_id: UUID, FK -> academic_years
- semester: smallint, hanya 1 atau 2
- class_id: UUID, FK -> classes
- subject_id: UUID, FK -> subjects
- teacher_id: UUID, FK -> teachers
- sumatif_number: integer, harus >= 1
- assessment_type: enum: written | practical
- assessment_date: date
- start_time: time
- end_time: time
- room: string nullable
- material: string nullable
- status: enum: scheduled | cancelled, default scheduled
- created_by: UUID nullable, referensi pengguna terautentikasi
- cancelled_at: timestamptz nullable
- cancelled_by: UUID nullable
- created_at, updated_at: timestamptz

Aturan:
- end_time harus > start_time.
- Nomor sumatif unik dalam kombinasi tahun ajaran + semester + kelas + mata pelajaran untuk record yang tidak dibatalkan (cara penegakan perlu disesuaikan dengan PostgreSQL partial unique index).
- Pembatalan tidak menghapus record.
- Validasi kuota harus dilakukan secara transaksional di server/database untuk mencegah dua permintaan bersamaan melewati batas.

## 3. Batasan bisnis wajib

1. Hanya semester 1 atau 2.
2. Hanya kelas dengan grade_level 1–6.
3. Penugasan guru harus cocok dan aktif untuk tahun ajaran, semester, kelas, dan mata pelajaran.
4. Tanggal harus valid dan tidak boleh diblokir kalender sekolah.
5. Jam harus valid dan waktu selesai sesudah waktu mulai.
6. Maksimum 2 asesmen tertulis aktif per kelas per tanggal.
7. Jika terdapat minimal satu asesmen praktik aktif pada kelas/tanggal itu, maksimum 3 asesmen aktif total.
8. Record cancelled tidak masuk hitungan kuota dan tetap ada di riwayat.
9. Potensi benturan jam guru atau kelas sebaiknya ditampilkan sebagai peringatan; apakah memblokir simpan perlu diputuskan.
10. Semua pemeriksaan kuota harus aman terhadap transaksi bersamaan, bukan hanya validasi antarmuka.

## 4. Indeks dan integritas yang disarankan

- Index assessment_schedules(academic_year_id, assessment_date, class_id, status)
- Index assessment_schedules(teacher_id, assessment_date, start_time)
- Index teacher_assignments(academic_year_id, semester, class_id, subject_id, teacher_id, is_active)
- Foreign keys dengan penghapusan yang aman; hindari cascade delete pada riwayat jadwal.
- CHECK constraints untuk semester, grade_level, sumatif_number, waktu selesai, dan nilai enum.
- Partial unique index untuk nomor sumatif unik hanya pada record scheduled.
- Kuota harian perlu validasi transaksional atau mekanisme lock yang teruji agar tidak terjadi race condition.

## 5. Keamanan / akses (rancangan awal)

- Pengguna harus terautentikasi untuk membuat, mengubah, atau membatalkan jadwal.
- Peran minimum yang disarankan: admin dan guru.
- Admin mengelola tahun ajaran, kelas, mapel, guru, penugasan, dan kalender sekolah.
- Guru hanya mengelola jadwal sesuai penugasan aktif, kecuali aturan sekolah mengizinkan cakupan yang lebih luas.
- Pembatalan menyimpan aktor dan waktu pembatalan.
- Terapkan otorisasi di server/database; jangan mengandalkan penyembunyian tombol di frontend.
- Jika memakai Supabase, aktifkan RLS dan uji kebijakan per tabel; jangan pernah mengekspos service-role key ke browser.
- Simpan rahasia hanya pada environment backend; jangan commit URL database berisi password atau token.

## 6. Belum diputuskan — perlu persetujuan

1. Apakah kelas/rombel dibuat ulang tiap tahun ajaran atau ID kelas yang sama dipakai lintas tahun?
2. Apakah guru boleh melihat semua jadwal atau hanya kelas/mapel yang ditugaskan?
3. Apakah guru boleh mengedit jadwal setelah disimpan, atau hanya admin?
4. Apakah pembatalan boleh dilakukan guru atau hanya admin?
5. Apakah benturan jam guru/kelas hanya peringatan atau memblokir penyimpanan?
6. Apakah boleh ada lebih dari satu guru untuk kelas + mapel + semester?
7. Apakah nomor sumatif boleh dipakai ulang setelah jadwal sebelumnya dibatalkan?
8. Apakah batas kuota berlaku per kelas (sesuai prototipe sekarang) atau sekolah secara keseluruhan per tanggal?
9. Apakah sekolah memakai Supabase Auth atau autentikasi lain?

## 7. Status implementasi

Dokumen ini hanya kontrak rancangan. Belum ada SQL migration, belum ada perubahan database, belum ada koneksi database, dan belum ada deployment.
