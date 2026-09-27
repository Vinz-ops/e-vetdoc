# [P1.1] Reconcile the template schema with E-VetDoc identity

## What was built

The template `admin | user` identity model is reconciled to `admin | veterinarian | owner`. The tracked migration maps existing template users to owners, backfills profile records for existing Auth users, keeps administrators unchanged, makes new profiles owners by default, removes obsolete generic dashboard tables, and keeps the existing service catalogue as the single temporary catalogue for Phase 2 to resolve.

## Automated checks

- [x] `pnpm lint` completes without errors.
- [x] Live Supabase schema lists `profiles`, `notifications`, `services`, `pets`, and `pet_owners`, all with RLS enabled.
- [x] Generated Supabase types match the connected schema's three role values.
- [x] The live profile-update policy includes a role-unchanged check while allowing the owner’s own contact-detail updates.
- [x] Tracked migrations were applied to a disposable database with legacy records: `admin` remained `admin`, `user` became `owner`, and new users defaulted to `owner`.

## Manual verification

1. In a disposable development database, create one profile with the legacy `admin` role and one with the legacy `user` role.
2. Apply `db/migrations/0001_reconcile_identity_schema.sql`.
3. Confirm the resulting profile roles are `admin` and `owner`, respectively.
4. Create a new Auth user and confirm the `handle_new_user` trigger creates an `owner` profile.
5. Confirm no profile can select a role from the profile settings form.
6. Confirm the old vehicle-oriented bookings and lead flows are absent, while there is still only one `services` catalogue.

## RLS smoke test

1. Authenticate as an owner and query `profiles`; confirm only that profile is returned.
2. Attempt to change your own role or another profile's role/contact fields; confirm RLS rejects it.
3. Authenticate as an administrator and confirm administrator profile management remains available.
4. Authenticate as a veterinarian and confirm it does not acquire administrator access merely by changing client input.

## Common issues

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Migration fails while changing `user_role` | An old default still depends on the enum. | Use the tracked migration, which drops the default before the conversion. |
| A legacy profile has an invalid role | A template value was customized outside the standard enum. | The migration maps it to `owner`; review the record and promote only through a future authorized staff workflow. |
| A user can change their own role | A client payload or profile update service exposes `role`. | Remove `role` from the update contract and recheck RLS. |
