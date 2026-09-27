# Pending Documentation Updates
- 2026-09-28: Added an idempotent seed migration for the published General Consultation and Vaccination services. Update the service catalogue documentation if clinic-specific pricing, durations, or further services are approved.
- 2026-09-27: Created `schedule_audit_logs` table in Supabase. Modified `src/services/appointments.ts` to log schedule creations, updates, and deletions. Updated `src/services/audit-logs.ts` to fetch these logs and merge them into the `getClinicActivityLogs` function.
