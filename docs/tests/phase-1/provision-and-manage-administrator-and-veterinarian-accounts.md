# Test: Provision and manage administrator and veterinarian accounts

**Phase:** Phase 1 - Foundation
**Task:** P1.3
**Date:** 2026-08-19

## What was built

P1.3 adds an admin-only staff management flow at `/dashboard/team` for adding existing accounts to the clinic staff, updating staff roles, deactivating staff, and reactivating staff. A person must create an E-VetDoc account before an admin can add them as a veterinarian or administrator. Profile names are synced from Supabase Auth metadata during email signup and Google OAuth sign-in. Staff lifecycle changes run through server actions in `src/services/staff.ts`, use service-role operations only from the server, write audit records, and protect the final active administrator in both application logic and a database trigger.

## Automated checks

- [x] `./node_modules/.bin/tsc --noEmit` exits 0
- [x] Focused ESLint exits 0 for the staff service, authorization service, team page, and staff UI component
- [x] `git diff --check` exits 0
- [x] `./node_modules/.bin/next build` exits 0
- [x] Drizzle migrations applied to the remote Supabase database through the Supabase session pooler
- [x] `src/types/supabase.ts` refreshed from the remote Supabase project
- [x] Live Supabase verification confirmed `profiles.is_active`, `staff_audit_logs`, `private.prevent_removing_final_active_admin`, `public.handle_new_user`, `public.sync_profile_from_auth_user`, and `protect_final_active_admin`
- [x] Live Supabase verification confirmed existing email-signup and Google-auth users were backfilled from Auth metadata into `profiles.full_name`

## Manual verification

1. Log in as an administrator.
2. Open `/dashboard/team`.
3. Create a normal account for a test user.
4. Add that account to the team by entering the same email and choosing the veterinarian role.
5. Confirm the add action shows a clear pending state and success toast.
6. Confirm the staff member appears in the staff list with an active status.
7. Try adding an email that has not created an account yet and confirm a clear error appears.
8. Confirm the staff member's full name appears from the name they entered during account creation or from their Google profile.
9. Change the staff member's role and confirm the warning/confirmation appears before saving.
10. Refresh `/dashboard/team` and confirm the updated role and full name still appear.
11. Deactivate the staff member and confirm they cannot access authenticated dashboard routes.
12. Reactivate the staff member and confirm their account can be used again.
13. Try to demote or deactivate the final active admin and confirm the action is blocked.
14. Log in as a non-admin staff or owner account and confirm `/dashboard/team` is not accessible.

## RLS smoke test

1. As an admin, confirm staff records can be listed and staff audit logs can be selected.
2. As a veterinarian, confirm staff audit logs return no rows or are denied by RLS.
3. As an owner, confirm staff audit logs return no rows or are denied by RLS.
4. Confirm `staff_audit_logs` grants only `SELECT` to `authenticated` and no privileges to `anon`.
5. Confirm direct profile role or active-status changes cannot remove the final active administrator.

## Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Account cannot be added | The email has not created an E-VetDoc account yet | Ask the person to create an account first, then add the same email |
| Staff card says `Name not set` | The account was created before profile-name syncing existed or Auth has no display metadata | Ask the user to set their profile name, or confirm Auth metadata contains `full_name` / `name` |
| `pnpm db:migrate` fails with `ENOTFOUND` | Local network cannot route to the direct Supabase Postgres host | Use the Supabase session pooler for migration connectivity or fix local IPv6 routing |
| Non-admin sees no audit logs | Expected RLS behavior | Verify with an admin account instead |
| Final admin change fails | Expected safety trigger | Create or reactivate another admin before demoting/deactivating the current final admin |
