/*
 * SUMATIF PLANNER — SUPABASE SCHEMA INVENTORY (READ ONLY)
 * SELECT-only inspection queries. This file does not mutate schema or data.
 * Review output before drafting any migration. Do not include secrets in reports.
 *
 * Run only against the intended Supabase project after confirming the project ref.
 * These queries inspect public schema and auth identity linkage; no user row data
 * or student personal data is selected.
 */

-- 1) Public tables and views
select table_schema, table_name, table_type
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- 2) Columns and data types for public tables/views
select table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- 3) Constraints: primary keys, foreign keys, unique constraints, checks
select tc.table_name, tc.constraint_name, tc.constraint_type,
       kcu.column_name, ccu.table_name as referenced_table,
       ccu.column_name as referenced_column, cc.check_clause
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_schema = kcu.constraint_schema
 and tc.constraint_name = kcu.constraint_name
 and tc.table_name = kcu.table_name
left join information_schema.constraint_column_usage ccu
  on tc.constraint_schema = ccu.constraint_schema
 and tc.constraint_name = ccu.constraint_name
left join information_schema.check_constraints cc
  on tc.constraint_schema = cc.constraint_schema
 and tc.constraint_name = cc.constraint_name
where tc.table_schema = 'public'
order by tc.table_name, tc.constraint_type, tc.constraint_name, kcu.ordinal_position;

-- 4) Index definitions on public tables
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- 5) RLS enabled/forced status
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p', 'v', 'm')
order by c.relname;

-- 6) RLS policies
select schemaname, tablename, policyname, permissive, roles,
       cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 7) Public functions/procedures: names and signatures only, not function bodies
select n.nspname as schema_name, p.proname as routine_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_function_result(p.oid) as result_type,
       p.prokind as routine_kind, p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname, arguments;

-- 8) Relevant auth foreign-key links from public tables to auth.users
select tc.table_name, kcu.column_name, ccu.table_name as referenced_table,
       ccu.column_name as referenced_column, tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_schema = kcu.constraint_schema
 and tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu
  on tc.constraint_schema = ccu.constraint_schema
 and tc.constraint_name = ccu.constraint_name
where tc.table_schema = 'public'
  and tc.constraint_type = 'FOREIGN KEY'
  and ccu.table_schema = 'auth'
  and ccu.table_name = 'users'
order by tc.table_name, kcu.column_name;

-- 9) Row counts are intentionally NOT included by default. After table names
-- are reviewed, collect only aggregate counts for specifically approved tables.
-- Do not SELECT student names, IDs, grades, or other personal rows for this audit.
