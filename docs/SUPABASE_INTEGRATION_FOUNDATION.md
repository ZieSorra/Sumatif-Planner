# Supabase integration foundation

This branch adds a browser-side client factory and an initial data adapter for the existing Supabase schema. The app screens still use the in-memory store; this does **not** make the prototype production-ready.

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

- Existing screens still use the in-memory demo store; the repository functions are not wired into the bridge or screens yet.
- `src/supabase-repository.js` maps the existing `academic_years`, `assessment_periods`, `classes`, `education_calendar`, `profiles`, `subjects`, `teacher_assignments`, and `sumatif_schedules` columns.
- No Supabase credentials are committed.
- No SQL migration or database write is part of this change.
- This is a foundation for the next integration step, not a release-ready integration.

## Before connecting schedule screens

1. Confirm the runtime config is injected by the deployment environment, not hard-coded with secrets.
2. Implement sign-in/sign-out UI and handle expired sessions.
3. Fetch the authenticated user's `profiles` row and enforce active profile state.
4. Wire the login and profile state into the application shell.
5. Wire the bridge to the async repository and replace demo IDs with actual UUIDs.
6. Check the actual RLS SELECT grants for each reference table; the adapter relies on RLS for authorization.
7. Test as an active teacher, an unassigned teacher, an inactive profile, and an admin.
8. Test database trigger behavior for cancelling schedules before relying on cancellation from the UI.

## Authorization notes from function review

- `is_admin()` checks `auth.uid()`, role `admin`, and `profiles.is_active = true`.
- `has_teacher_assignment(..., p_teacher_id)` checks a matching active assignment but does not itself require `p_teacher_id = auth.uid()`. Any client-facing policy that calls it must separately bind the teacher identity to `auth.uid()` for teacher operations.
- Current DELETE policy reported during review allows teachers to delete their own rows. This differs from the project requirement that teachers cancel records and only admins hard-delete. Resolve this explicitly before production use.

## Existing database rules remain authoritative

Do not change the existing tables, triggers, constraints, or quota rules as part of this foundation. Frontend validation must mirror the database behavior. If cancellation is blocked by current triggers, document and test that exact behavior before proposing the smallest possible fix.
