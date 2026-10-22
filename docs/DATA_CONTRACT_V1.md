# Sumatif Planner — Kontrak Data v1 (Draft)

Status: DRAFT v1.4 — pembaruan mengikuti ketentuan Sumatif Planner yang sudah ada; tidak dimaksudkan untuk mengubah aturan bisnis. Menunggu persetujuan final sebelum migrasi database.
Tujuan: menyepakati entitas, relasi, batasan bisnis, dan akses sebelum integrasi database.
Sumber kebenaran: ketentuan dan perilaku Sumatif Planner yang sudah ada. Perubahan ini berfokus pada pembaruan struktur dan kesiapan integrasi; jangan menambahkan atau mengubah aturan bisnis tanpa instruksi eksplisit pemilik proyek.

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
- id: UUID, primary key (identitas rombel tetap lintas tahun ajaran)
- stable_code: string nullable, unik jika tersedia
- is_active: boolean
- created_at, updated_at: timestamptz

### class_years
- id: UUID, primary key
- class_id: UUID, FK -> classes
- academic_year_id: UUID, FK -> academic_years
- display_name: string (mis. 5-A pada tahun ajaran tertentu)
- grade_level: integer, dibatasi 1–6
- created_at: timestamptz
- unique(class_id, academic_year_id)

Keputusan yang dikonfirmasi:
- ID rombel tetap digunakan lintas tahun ajaran.
- Label dan tingkat kelas disimpan dalam konteks tahun ajaran supaya riwayat tidak berubah.
- Pembaruan tidak boleh mengubah perilaku jadwal atau riwayat yang sudah ada.

### subjects
- id: UUID, primary key
- name: string
- code: string, unique bila kode resmi tersedia
- is_active: boolean
- created_at, updated_at: timestamptz

### profiles (identitas guru dan admin)
- id: UUID, primary key dan FK -> auth.users(id) Supabase Auth
- display_name: string
- role: admin | teacher
- is_active: boolean
- created_at, updated_at: timestamptz

Catatan: nama tabel final harus diperiksa terhadap skema Supabase yang sudah ada; jangan membuat tabel duplikat bila profil pengguna telah tersedia.

### teacher_assignments
- id: UUID, primary key
- academic_year_id: UUID, FK -> academic_years
- class_year_id: UUID, FK -> class_years (kelas pada tahun ajaran yang sesuai)
- subject_id: UUID, FK -> subjects
- teacher_id: UUID, FK -> profiles
- semester: smallint, hanya 1 atau 2 (PROVISIONAL: belum boleh menjadi pembatas tambahan jika penugasan lama tidak berbasis semester)
- is_active: boolean
- created_at, updated_at: timestamptz

Aturan:
- Jadwal hanya valid jika terdapat penugasan aktif yang cocok dengan tahun ajaran + kelas + mata pelajaran + guru. Pencocokan semester pada penugasan masih bersifat provisional sampai kesesuaian dengan aturan lama terverifikasi.
- Validasi penugasan harus mempertahankan ketentuan yang sudah berjalan. Jangan memperkenalkan pembatasan baru jumlah guru per kombinasi kelas/mapel/semester tanpa acuan dari aturan lama.

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
- class_year_id: UUID, FK -> class_years (kelas pada tahun ajaran yang sesuai)
- subject_id: UUID, FK -> subjects
- teacher_id: UUID, FK -> profiles
- sumatif_number: integer, rentang 1–3 sesuai validasi prototipe saat ini
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
3. Penugasan guru harus cocok dan aktif untuk tahun ajaran, kelas, mata pelajaran, dan guru; pencocokan semester pada penugasan hanya diterapkan jika terbukti bagian dari ketentuan lama.
4. Tanggal harus valid dan tidak boleh diblokir kalender sekolah.
5. Jam harus valid dan waktu selesai sesudah waktu mulai.
6. Maksimum 2 asesmen tertulis aktif per kelas per tanggal.
7. Jika terdapat minimal satu asesmen praktik aktif pada kelas/tanggal itu, maksimum 3 asesmen aktif total.
8. Record cancelled tidak masuk hitungan kuota dan tetap ada di riwayat.
9. Potensi benturan waktu guru atau kelas ditampilkan sebagai peringatan dan tidak memblokir penyimpanan.
10. Semua pemeriksaan kuota harus aman terhadap transaksi bersamaan, bukan hanya validasi antarmuka.

## 4. Indeks dan integritas yang disarankan

- Index assessment_schedules(academic_year_id, semester, assessment_date, class_year_id, status)
- Index assessment_schedules(teacher_id, assessment_date, start_time)
- Index teacher_assignments(academic_year_id, class_year_id, subject_id, teacher_id, is_active)
- Foreign keys dengan penghapusan yang aman; hindari cascade delete pada riwayat jadwal.
- CHECK constraints untuk semester, grade_level, sumatif_number, waktu selesai, dan nilai enum.
- Partial unique index untuk nomor sumatif unik hanya pada record scheduled.
- Kuota harian perlu validasi transaksional atau mekanisme lock yang teruji agar tidak terjadi race condition.

## 5. Keamanan / akses (rancangan awal)

- Autentikasi menggunakan Supabase Auth.
- Peran minimum: admin dan guru, dipetakan melalui profil internal yang terhubung ke `auth.users.id`.
- Admin mengelola tahun ajaran, kelas, mapel, guru, penugasan, kalender sekolah, serta dapat membuat, mengedit, dan membatalkan jadwal.
- Guru hanya dapat membaca jadwal yang terkait dengan penugasan kelas/mata pelajaran aktif miliknya. Dalam kontrak saat ini, guru tidak dapat mengedit atau membatalkan jadwal.
- Pembatalan menyimpan aktor dan waktu pembatalan.
- Semua aturan di atas harus ditegakkan melalui RLS dan/atau fungsi backend yang aman, bukan hanya UI.
- Terapkan otorisasi di server/database; jangan mengandalkan penyembunyian tombol di frontend.
- Jika memakai Supabase, aktifkan RLS dan uji kebijakan per tabel; jangan pernah mengekspos service-role key ke browser.
- Simpan rahasia hanya pada environment backend; jangan commit URL database berisi password atau token.

## 6. Prinsip pembaruan (tanpa perubahan aturan bisnis)

Ketentuan yang sudah dikonfirmasi untuk pembaruan ini:
- ID rombel tetap lintas tahun ajaran.
- Guru hanya dapat melihat jadwal kelas/mapel sesuai penugasan aktif.
- Hanya admin yang boleh mengedit dan membatalkan jadwal.
- Benturan waktu menjadi peringatan dan tidak memblokir penyimpanan.
- Autentikasi menggunakan Supabase Auth.
- Batas kuota, nomor sumatif, kalender sekolah, status jadwal, dan validasi lain tetap mengikuti aturan yang sudah ada pada Sumatif Planner.

Ketentuan implementasi:
- Jangan menambah aturan bisnis baru atau mengubah perilaku lama hanya berdasarkan asumsi desain database.
- Jika ditemukan perbedaan antara dokumen ini dan perilaku aplikasi yang sudah ada, catat perbedaannya untuk ditinjau; jangan diam-diam mengganti aturan.
- Pertahankan riwayat jadwal yang sudah dibatalkan.
- Migrasi nanti harus disiapkan untuk pembaruan/penyimpanan data yang sudah ada, bukan memulai ulang aturan dari nol.

## 7. Catatan penyelarasan review
- Skema `classes + class_years` adalah rancangan pemisahan identitas tetap dan label tahunan, belum perubahan database.
- Validasi kuota wajib mencakup tahun ajaran, semester, kelas pada tahun ajaran, dan tanggal, sesuai domain saat ini.
- `teacher_assignments.semester` pada draf SQL belum dipastikan kompatibel dengan penugasan yang sudah ada; jangan jadikan constraint yang mengubah perilaku tanpa bukti.
- Implementasi RLS dan fungsi transaksi masih memerlukan rancangan dan pengujian terpisah.
- Tidak ada klaim bahwa skema Supabase target telah diperiksa.

## 8. Status implementasi

Dokumen ini hanya kontrak rancangan. Belum ada SQL migration, belum ada perubahan database, belum ada koneksi database, dan belum ada deployment.
