/*
 * SUMATIF PLANNER — SQL SCHEMA DRAFT (REVIEW ONLY)
 * Status: NOT A MIGRATION. DO NOT RUN against any database.
 * This file is documentation for design review, intentionally stored under docs/.
 * No Supabase connection, migration execution, or production database write has occurred.
 *
 * Compatibility goals:
 * - Preserve the current business rules and cancelled schedule history.
 * - Supabase Auth; admin-only schedule mutations; teachers read assigned schedules only.
 * - Keep class/rombel identity stable across academic years.
 * - Treat time overlaps as warnings, not write blockers.
 * - Enforce daily quotas atomically when the implementation is later approved.
 *
 * IMPORTANT DESIGN NOTE:
 * The existing draft contract stores grade_level directly on classes, but a stable
 * class ID across academic years means the grade level/display label can change per
 * year. This draft introduces class_years as a year-specific snapshot. Contract
 * documentation should be updated and approved before any real migration is written.
 */

-- Extensions / enums: names are illustrative and must be reconciled with the target
-- Supabase project before implementation.
-- create extension if not exists pgcrypto;
-- create type public.assessment_type as enum ('written', 'practical');
-- create type public.schedule_status as enum ('scheduled', 'cancelled');
-- create type public.app_role as enum ('admin', 'teacher');

-- Academic years
-- create table public.academic_years (
--   id uuid primary key default gen_random_uuid(),
--   name text not null unique,
--   starts_on date not null,
--   ends_on date not null,
--   is_active boolean not null default false,
--   created_at timestamptz not null default now(),
--   updated_at timestamptz not null default now(),
--   constraint academic_years_dates_check check (starts_on <= ends_on)
-- );

-- Stable rombel identity, independent of academic year.
-- create table public.classes (
--   id uuid primary key default gen_random_uuid(),
--   stable_code text unique,
--   is_active boolean not null default true,
--   created_at timestamptz not null default now(),
--   updated_at timestamptz not null default now()
-- );

-- Per-year class label and grade level; preserves historic class presentation.
-- create table public.class_years (
--   id uuid primary key default gen_random_uuid(),
--   class_id uuid not null references public.classes(id) on delete restrict,
--   academic_year_id uuid not null references public.academic_years(id) on delete restrict,
--   display_name text not null,
--   grade_level smallint not null check (grade_level between 1 and 6),
--   created_at timestamptz not null default now(),
--   unique (class_id, academic_year_id),
--   unique (id, academic_year_id)
-- );

-- Subjects and teacher profiles linked to Supabase Auth.
-- create table public.subjects (
--   id uuid primary key default gen_random_uuid(),
--   name text not null,
--   code text unique,
--   is_active boolean not null default true,
--   created_at timestamptz not null default now(),
--   updated_at timestamptz not null default now()
-- );

-- create table public.profiles (
--   id uuid primary key references auth.users(id) on delete restrict,
--   display_name text not null,
--   role text not null check (role in ('admin', 'teacher')),
--   is_active boolean not null default true,
--   created_at timestamptz not null default now(),
--   updated_at timestamptz not null default now()
-- );

-- create table public.teacher_assignments (
--   id uuid primary key default gen_random_uuid(),
--   academic_year_id uuid not null references public.academic_years(id) on delete restrict,
--   class_year_id uuid not null,
--   subject_id uuid not null references public.subjects(id) on delete restrict,
--   teacher_id uuid not null references public.profiles(id) on delete restrict,
--   semester smallint not null check (semester in (1, 2)),
--   is_active boolean not null default true,
--   created_at timestamptz not null default now(),
--   updated_at timestamptz not null default now(),
--   foreign key (class_year_id, academic_year_id)
--     references public.class_years(id, academic_year_id) on delete restrict
-- );

-- School calendar. More than one event can exist on a date.
-- create table public.school_calendar_events (
--   id uuid primary key default gen_random_uuid(),
--   academic_year_id uuid not null references public.academic_years(id) on delete restrict,
--   event_date date not null,
--   title text not null,
--   blocks_assessments boolean not null default true,
--   created_at timestamptz not null default now(),
--   updated_at timestamptz not null default now()
-- );

-- Schedule records. Cancellation is a status update; never hard-delete history.
-- create table public.assessment_schedules (
--   id uuid primary key default gen_random_uuid(),
--   academic_year_id uuid not null references public.academic_years(id) on delete restrict,
--   class_year_id uuid not null,
--   semester smallint not null check (semester in (1, 2)),
--   subject_id uuid not null references public.subjects(id) on delete restrict,
--   teacher_id uuid not null references public.profiles(id) on delete restrict,
--   sumatif_number smallint not null check (sumatif_number between 1 and 3),
--   assessment_type public.assessment_type not null,
--   assessment_date date not null,
--   start_time time not null,
--   end_time time not null,
--   room text,
--   material text,
--   status public.schedule_status not null default 'scheduled',
--   created_by uuid references public.profiles(id) on delete restrict,
--   cancelled_at timestamptz,
--   cancelled_by uuid references public.profiles(id) on delete restrict,
--   created_at timestamptz not null default now(),
--   updated_at timestamptz not null default now(),
--   constraint assessment_time_order check (end_time > start_time),
--   foreign key (class_year_id, academic_year_id)
--     references public.class_years(id, academic_year_id) on delete restrict,
--   constraint cancellation_metadata_check check (
--     (status = 'scheduled' and cancelled_at is null and cancelled_by is null)
--     or status = 'cancelled'
--   )
-- );

-- Only scheduled records reserve a sumatif number; cancelled history remains.
-- create unique index assessment_schedule_sequence_active_uq
--   on public.assessment_schedules
--   (academic_year_id, semester, class_year_id, subject_id, sumatif_number)
--   where status = 'scheduled';

-- Suggested query indexes.
-- create index assessment_schedule_class_date_idx
--   on public.assessment_schedules (academic_year_id, assessment_date, class_year_id, status);
-- create index assessment_schedule_teacher_time_idx
--   on public.assessment_schedules (teacher_id, assessment_date, start_time, end_time);
-- create index teacher_assignments_lookup_idx
--   on public.teacher_assignments (academic_year_id, semester, class_year_id, subject_id, teacher_id)
--   where is_active;

-- RLS policy/function outline — NOT IMPLEMENTED:
-- 1. Enable RLS on all public tables.
-- 2. Admin can manage configuration and schedule rows.
-- 3. Teacher can SELECT only schedules where an active teacher_assignment
--    matches auth.uid(), schedule class_year_id, subject_id, academic_year_id,
--    and semester.
-- 4. Teacher cannot INSERT, UPDATE, or DELETE schedules.
-- 5. No client role may hard-delete schedule history.
-- 6. Protect profile role changes; users must not be able to promote themselves.
-- 7. Never expose a Supabase service_role key to the browser.

-- Transactional quota enforcement outline — NOT IMPLEMENTED:
-- A trusted database function should serialize schedule writes for the same
-- class_year_id + assessment_date (for example via an advisory lock), then:
--   a. validate active teacher assignment and school calendar;
--   b. count active written assessments for that class/date and enforce <= 2;
--   c. if any active practical assessment exists for the class/date, enforce
--      total active assessments <= 3;
--   d. persist the change in the same transaction.
-- The final function must handle edits by excluding the edited record and
-- must not treat cancelled records as active.
-- Time overlaps remain warnings and must not abort the transaction.

-- Migration/data preservation outline — NOT IMPLEMENTED:
-- 1. Inspect the target schema read-only and record its current version.
-- 2. Back up existing data and identify stable class IDs and year-specific labels.
-- 3. Map current class/year data into classes + class_years without changing
--    existing schedule identifiers where those identifiers already exist.
-- 4. Preserve cancelled schedules and cancellation history.
-- 5. Run row-count, foreign-key, quota, status, and duplicate-sequence checks.
-- 6. Test RLS as admin, assigned teacher, unassigned teacher, and anonymous user.
-- 7. Apply only after contract and migration plan receive explicit final approval.
