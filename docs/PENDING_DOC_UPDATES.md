# Pending Documentation Updates
- 2026-09-27: Created `schedule_audit_logs` table in Supabase. Modified `src/services/appointments.ts` to log schedule creations, updates, and deletions. Updated `src/services/audit-logs.ts` to fetch these logs and merge them into the `getClinicActivityLogs` function.
