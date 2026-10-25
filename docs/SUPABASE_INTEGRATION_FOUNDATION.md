# Supabase integration foundation

This branch adds a browser-side client factory and an initial data adapter for the existing Supabase schema. The bridge and core schedule screens now select Supabase mode when runtime configuration is present; this does **not** make the prototype production-ready.

## Runtime configuration

Before importing `src/supabase-client.js`, define:

```js
window.ZIESORRA_SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  publishableKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
};
```

Use only the project's publishable/anon key in browser code. Never expose a `service_role` key in this repository or client app. RLS must protect every table exposed to the browser.

The client library is loaded from `https://esm.sh/@supabase/supabase-js@2` at runtime, so a working network connection and an appropriate deployment CSP are required.

## Verified current boundaries

- `src/screen-bridge.js` dispatches schedule reads/writes to Supabase when runtime config is present; otherwise it retains demo mode.
- The app shell has a Supabase sign-in gate. The form loads live reference data and submits database UUIDs. Dashboard, calendar, reports, and cancellation read/write through the bridge.
- Actual project credentials, live RLS behavior, foreign-key joins, and trigger behavior have not been tested in this environment.
- `src/supabase-repository.js` maps the existing `academic_years`, `assessment_periods`, `classes`, `education_calendar`, `profiles`, `subjects`, `teacher_assignments`, and `sumatif_schedules` columns.
- No Supabase credentials are committed.
- No SQL migration or database write is part of this change.
- This is an integration candidate for verification, not a release-ready deployment.

## Before connecting schedule screens

1. Fill `supabase-url` and `supabase-publishable-key` in `index.html` for a test deployment, or inject equivalent runtime config before the app module runs. Use only the publishable/anon key, never `service_role`.
2. Check actual RLS SELECT grants for each reference table and verify the profile query and relationship joins.
3. Test as an active teacher, an unassigned teacher, an inactive profile, and an admin.
4. Test create, edit, and cancellation against actual database triggers and constraints.
5. Resolve the hard-delete RLS policy conflict before production; app-level admin checks do not replace RLS.

## Authorization notes from function review

- `is_admin()` checks `auth.uid()`, role `admin`, and `profiles.is_active = true`.
- `has_teacher_assignment(..., p_teacher_id)` checks a matching active assignment but does not itself require `p_teacher_id = auth.uid()`. Any client-facing policy that calls it must separately bind the teacher identity to `auth.uid()` for teacher operations.
- Current DELETE policy reported during review allows teachers to delete their own rows. This differs from the project requirement that teachers cancel records and only admins hard-delete. Resolve this explicitly before production use.

## Existing database rules remain authoritative

Do not change the existing tables, triggers, constraints, or quota rules as part of this foundation. Frontend validation must mirror the database behavior. If cancellation is blocked by current triggers, document and test that exact behavior before proposing the smallest possible fix.
