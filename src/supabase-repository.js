/**
 * Supabase data adapter for the existing Sumatif Planner schema.
 *
 * Uses existing table and column names. No schema migration is required by
 * this module. All writes use the signed-in user's client so RLS remains active.
 */
import { getSupabaseClient, requireCurrentUser } from "./supabase-client.js";

function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

function mapSchedule(row) {
  return {
    id: row.id,
    academicYearId: row.academic_year_id,
    semester: row.semester,
    classId: row.class_id,
    subjectId: row.subject_id,
    teacherId: row.teacher_id,
    sumatifNumber: row.sumatif_number,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    material: row.material,
    assessmentType: row.assessment_type,
    room: row.room,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    academicYear: row.academic_years?.name ?? null,
    className: row.classes?.name ?? null,
    subject: row.subjects?.name ?? null,
    teacher: row.profiles?.full_name ?? null
  };
}

function schedulePayload(input) {
  const payload = {
    academic_year_id: input.academicYearId,
    semester: Number(input.semester),
    class_id: input.classId,
    subject_id: input.subjectId,
    teacher_id: input.teacherId,
    sumatif_number: Number(input.sumatifNumber),
    date: input.date,
    start_time: input.startTime || null,
    end_time: input.endTime || null,
    material: String(input.material ?? "").trim(),
    assessment_type: input.assessmentType,
    room: input.room?.trim() || null,
    notes: input.notes?.trim() || null
  };
  if (input.status) payload.status = input.status;
  return payload;
}

export async function getSignedInProfile() {
  const user = await requireCurrentUser();
  const client = await getSupabaseClient();
  const row = unwrap(await client
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle());

  if (!row || !row.is_active) {
    await client.auth.signOut();
    throw new Error("Profil pengguna tidak ditemukan atau tidak aktif. Hubungi admin sekolah.");
  }
  if (!["admin", "teacher"].includes(row.role)) {
    throw new Error("Peran pengguna tidak dikenali.");
  }
  return { ...row, authUserId: user.id };
}

export async function loadPlannerReferenceData() {
  const profile = await getSignedInProfile();
  const client = await getSupabaseClient();

  const [yearsResult, periodsResult, classesResult, subjectsResult, calendarResult, assignmentsResult] =
    await Promise.all([
      client.from("academic_years")
        .select("id, name, start_date, end_date, is_active")
        .order("start_date", { ascending: false }),
      client.from("assessment_periods")
        .select("id, academic_year_id, semester, type, start_date, end_date, description")
        .order("start_date"),
      client.from("classes")
        .select("id, academic_year_id, name, level, is_active")
        .eq("is_active", true)
        .order("level")
        .order("name"),
      client.from("subjects")
        .select("id, name, short_name, is_active")
        .eq("is_active", true)
        .order("name"),
      client.from("education_calendar")
        .select("id, academic_year_id, semester, date, day_type, title, description, is_selectable")
        .order("date"),
      client.from("teacher_assignments")
        .select("id, academic_year_id, teacher_id, class_id, subject_id, is_active")
        .eq("is_active", true)
    ]);

  const years = unwrap(yearsResult);
  const periods = unwrap(periodsResult);
  const classes = unwrap(classesResult);
  const subjects = unwrap(subjectsResult);
  const calendar = unwrap(calendarResult);
  const assignments = unwrap(assignmentsResult);

  const visibleAssignments = profile.role === "admin"
    ? assignments
    : assignments.filter(row => row.teacher_id === profile.authUserId);

  const visibleClassIds = new Set(visibleAssignments.map(row => row.class_id));
  const visibleSubjectIds = new Set(visibleAssignments.map(row => row.subject_id));

  return {
    profile,
    academicYears: years,
    assessmentPeriods: periods,
    classes: profile.role === "admin"
      ? classes
      : classes.filter(row => visibleClassIds.has(row.id)),
    subjects: profile.role === "admin"
      ? subjects
      : subjects.filter(row => visibleSubjectIds.has(row.id)),
    calendar,
    assignments: visibleAssignments
  };
}

export async function listSchedules({ academicYearId, semester, status } = {}) {
  const profile = await getSignedInProfile();
  const client = await getSupabaseClient();
  let query = client
    .from("sumatif_schedules")
    .select(`
      id, academic_year_id, semester, class_id, subject_id, teacher_id,
      sumatif_number, date, start_time, end_time, material, assessment_type,
      room, notes, status, created_at, updated_at,
      academic_years(name), classes(name), subjects(name), profiles(full_name)
    `)
    .order("date")
    .order("start_time");

  if (academicYearId) query = query.eq("academic_year_id", academicYearId);
  if (semester !== undefined && semester !== null) query = query.eq("semester", Number(semester));
  if (status) query = query.eq("status", status);

  // RLS is the security boundary. This filter is an additional UI-level scope.
  if (profile.role !== "admin") query = query.eq("teacher_id", profile.authUserId);

  return unwrap(await query).map(mapSchedule);
}

export async function createSchedule(input) {
  const profile = await getSignedInProfile();
  const client = await getSupabaseClient();
  const payload = schedulePayload(input);

  if (profile.role === "teacher" && payload.teacher_id !== profile.authUserId) {
    throw new Error("Guru hanya dapat membuat jadwal atas nama akun sendiri.");
  }

  const row = unwrap(await client
    .from("sumatif_schedules")
    .insert(payload)
    .select(`
      id, academic_year_id, semester, class_id, subject_id, teacher_id,
      sumatif_number, date, start_time, end_time, material, assessment_type,
      room, notes, status, created_at, updated_at,
      academic_years(name), classes(name), subjects(name), profiles(full_name)
    `)
    .single());

  return mapSchedule(row);
}

export async function updateSchedule(id, input) {
  const profile = await getSignedInProfile();
  const client = await getSupabaseClient();
  const payload = schedulePayload(input);

  if (profile.role === "teacher" && payload.teacher_id !== profile.authUserId) {
    throw new Error("Guru hanya dapat mengubah jadwal atas nama akun sendiri.");
  }

  const row = unwrap(await client
    .from("sumatif_schedules")
    .update(payload)
    .eq("id", id)
    .select(`
      id, academic_year_id, semester, class_id, subject_id, teacher_id,
      sumatif_number, date, start_time, end_time, material, assessment_type,
      room, notes, status, created_at, updated_at,
      academic_years(name), classes(name), subjects(name), profiles(full_name)
    `)
    .single());

  return mapSchedule(row);
}

export async function cancelScheduleInDatabase(id) {
  const profile = await getSignedInProfile();
  const client = await getSupabaseClient();

  // The database's existing triggers run on UPDATE. Cancellation must be tested
  // against the actual project's trigger behavior before production use.
  let query = client
    .from("sumatif_schedules")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (profile.role !== "admin") query = query.eq("teacher_id", profile.authUserId);

  const row = unwrap(await query
    .select("id, status, updated_at")
    .single());

  return row;
}

export async function deleteSchedulePermanently(id) {
  const profile = await getSignedInProfile();
  if (profile.role !== "admin") {
    throw new Error("Hanya admin yang boleh menghapus jadwal secara permanen.");
  }
  const client = await getSupabaseClient();
  unwrap(await client.from("sumatif_schedules").delete().eq("id", id));
  return { id, deleted: true };
}
