# MASTERPLAN — E-VetDoc

> E-VetDoc is a single-clinic veterinary management system for pet owners, veterinarians, appointments, medical records, invoicing, and receipts.

## **PHASE 0: DannFlow template readiness**

- [x] **[P0.1] Connect the Supabase template environment**
  - **Goal:** Complete the template’s Supabase environment configuration and verify the tracked baseline migration against the E-VetDoc project.
  - **Dependencies:** A valid `DATABASE_URL` for Supabase project `zmdtwhqirmkptzobufio` must be available in `.env.local`.
  - **Acceptance criteria:** Required environment values are present locally; the baseline migration completes; public tables and functions are verified; generated Supabase types are current.
  - **Run:** `/setup-supabase`

- [x] **[P0.2] Configure template email authentication and redirects**
  - **Goal:** Configure Supabase email authentication, Gmail SMTP delivery, confirmation and recovery redirects, and branded email templates for E-VetDoc.
  - **Dependencies:** [P0.1].
  - **Acceptance criteria:** Email confirmation is enabled; SMTP delivery works; local redirect settings are applied; branded confirmation and reset templates are saved; email confirmation and password reset both complete successfully.
  - **Run:** `/setup-auth`

- [x] **[P0.3] Apply the E-VetDoc visual direction to the template UI**
  - **Goal:** Establish the calm, clinic-oriented visual direction, semantic color system, landing-page and sign-in copy, and template visual cleanup.
  - **Dependencies:** Product context is approved.
  - **Acceptance criteria:** The landing and sign-in pages clearly communicate E-VetDoc’s audience and purpose; UI changes follow the responsive, accessible Shadcn/Tailwind design rules.
  - **Run:** `/design-project`

- [x] **[P0.4] Configure Google OAuth sign-in**
  - **Goal:** Configure and verify Google sign-in through Google Cloud and Supabase Auth for E-VetDoc.
  - **Dependencies:** [P0.1], [P0.2], [P0.3].
  - **Acceptance criteria:** Google Cloud consent-screen audience and Web client are configured; the Google-to-Supabase callback URI and Supabase-to-app redirect URL are correct; the Supabase Google provider is enabled; a permitted test user signs in and reaches `/dashboard`.
  - **Run:** `/setup-auth`

- [x] **[P0.5] Prepare hero media direction and handoff**
  - **Goal:** Define the hero-media brief that supports E-VetDoc’s reassuring clinic experience.
  - **Dependencies:** [P0.3].
  - **Acceptance criteria:** A reusable asset brief specifies subject, composition, tone, accessibility considerations, and required formats; assets are ready for template integration.
  - **Run:** `/hero-bg`

- [x] **[P0.6] Complete template visual and quality review**
  - **Goal:** Review the configured template for discoverability, marketing clarity, and implementation quality before product modules are planned.
  - **Dependencies:** [P0.2], [P0.3], [P0.4], [P0.5].
  - **Acceptance criteria:** SEO, marketing, and code-quality review findings are resolved or documented with follow-up work for a later phase.
  - **Run:** `/seo-check`, `/marketing-check`, `/review`

- [x] **[P0.7] Create Phase 0 setup and handover guide**
  - **Goal:** Provide a clear, safe handover guide for another developer to configure and verify E-VetDoc's local environment, Supabase services, authentication, email delivery, Google OAuth, visual direction, and final quality checks.
  - **Dependencies:** None. The guide must clearly distinguish completed, pending, and production-only steps.
  - **Acceptance criteria:** The guide names every required dashboard location and local command; contains copy-paste values only where safe; links to reusable email templates; never contains credentials; and includes a verification and handover checklist.
  - **Run:** Review `docs/handover/phase-0-setup-handover.md`.

- [x] **[P0.8] Configure Vercel production deployment and authentication URLs**
  - **Goal:** Deploy the approved E-VetDoc build on Vercel and connect its production origin to Supabase Auth and Google OAuth without exposing credentials.
  - **Dependencies:** [P0.1], [P0.2], [P0.3], [P0.4], [P0.6], [P0.7].
  - **Acceptance criteria:** Vercel has the required production environment variables; `NEXT_PUBLIC_SITE_URL` uses the canonical HTTPS production origin; the production deployment succeeds; Supabase Site URL and redirect allow list contain the production URLs; Google Cloud has the production JavaScript origin; and email, recovery, and Google sign-in work in production.
  - **Run:** `/setup-vercel`.

---

## **PHASE 1: Identity, access, and patient registry**

**Exit state:** Admins can provision staff, owners can complete onboarding and manage only linked pets, staff can find the registry, and role/RLS isolation is verified.

- [x] **[P1.1] Reconcile the template schema with E-VetDoc identity**
  - **Goal:** Replace the template's `admin | user` role model with the approved E-VetDoc identity model, reconcile generic dashboard tables that overlap the domain, and document any compatibility migration.
  - **Dependencies:** [P0.1].
  - **Acceptance criteria:** Roles are consistently `admin`, `veterinarian`, and `owner`; the authority model for any dual-role staff is explicit; legacy `user` data has a safe mapping; no competing appointment/service model is introduced.

- [x] **[P1.2] Implement profiles, role policies, and guarded routes**
  - **Goal:** Implement role-aware profiles, server-side authorization helpers, dashboard redirects, and RLS policies.
  - **Dependencies:** [P1.1].
  - **Acceptance criteria:** Roles remain application data rather than editable auth metadata; every protected route denies the wrong role; profile access follows RLS; authorization logic lives in `src/services/`.

- [x] **[P1.3] Provision and manage administrator and veterinarian accounts**
  - **Goal:** Give authorized admins a server-only account invitation/provisioning workflow and a staff-management UI.
  - **Dependencies:** [P1.2].
  - **Acceptance criteria:** Admins can create, update, and deactivate staff without exposing service credentials; confirmation behavior is clear; the final administrator cannot be accidentally removed; all actions are authorized and auditable.

- [x] **[P1.4] Complete owner onboarding and profile management**
  - **Goal:** Deliver the owner sign-up, email-confirmation, profile-completion, and self-service profile flows.
  - **Dependencies:** [P1.2], [P0.2].
  - **Acceptance criteria:** New owners cannot access protected pages before confirmation; profile completion is labelled, accessible, and mobile-ready; owners can update only their own permitted details.

- [x] **[P1.5] Deliver pet ownership and staff registry MVP**
  - **Goal:** Add `pets` and `pet_owners` as the sole ownership model, then deliver the owner pet-management flow, staff owner/pet registry, and focused authorization verification.
  - **Dependencies:** [P1.3], [P1.4].
  - **Acceptance criteria:** Pets include the MVP patient fields; `pet_owners` supports co-owner, primary-contact, medical-record, and notification permissions; `pets` has no competing direct `owner_id`; owners manage only their permitted pets; staff can search owners and pets; RLS and service tests prove owner isolation and staff/admin boundaries.

## **PHASE 2: Appointment and check-in operations**

**Exit state:** Owners can request visits, staff can schedule or check in visits and walk-ins, and all users see the correct appointment status and detail.

- [x] **[P2.1] Implement appointment rules, schema, lifecycle, and RLS**
  - **Goal:** Finalize the MVP scheduling decisions, reconcile the service catalogue, and model appointments, check-ins, status history, and RLS.
  - **Dependencies:** [P1.5].
  - **Acceptance criteria:** Service duration, assignment, double-booking, cancellation/rescheduling, owner cancellation, and walk-in minimum data have clear rules; appointments support requested, scheduled/confirmed, completed, cancelled, and no-show states; owner access follows `pet_owners`; status history and check-in data are retained.

- [x] **[P2.2] Deliver owner appointment requests and appointment history**
  - **Goal:** Let owners request visits for linked pets, view appointment status/history, and print appointment details.
  - **Dependencies:** [P2.1].
  - **Acceptance criteria:** Only linked pets are selectable; requests follow the scheduling rules; owners never see another owner's pet or contact data; submission, validation, confirmation, history, and print states work on mobile and desktop.

- [x] **[P2.3] Deliver staff schedule, check-in, and status workspace**
  - **Goal:** Give staff the operational schedule, appointment-detail actions, walk-in check-in, and clinic logbook needed for daily appointment handling.
  - **Dependencies:** [P2.1].
  - **Acceptance criteria:** Staff can schedule, reschedule, cancel, complete, and mark no-show only through valid transitions; walk-ins capture required minimum data; the schedule/logbook handles loading, conflicts, empty periods, and status; appointment RLS and service tests cover staff and owner access.

- [x] **[P2.3.1] Admin-managed appointment schedules and configuration**
  - **Goal:** Admins can define weekly available schedules with per-slot capacity limits, and owners see available/filled slots when requesting appointments in a Google Calendar-style UI.
  - **Dependencies:** [P2.1], [P2.2].
  - **Acceptance criteria:** 
    - Admins can create/update weekly appointment schedules with start/end times and max capacity per slot (e.g., max 3 appointments per time slot)
    - Owners see a Google Calendar-style UI showing available and filled time slots when requesting/new appointments
    - Attempting to book beyond capacity returns a clear error and disables the slot
    - Admins can modify or cancel scheduled time slots, with appropriate RLS
    - Existing appointment flow integrates: request → view available slots → book within capacity → auto-schedule appointment (removed legacy "requested" state)
- [x] **[P2.3.2] Advanced appointment management, schedule conflict prevention, and owner record integration**
  - **Goal:** Enhance appointment scheduling with overlap prevention, quick calendar shortcuts, search/status/date filtering, pagination, and a 2-tab owner/patient appointment record view.
  - **Dependencies:** [P2.3.1].
  - **Acceptance criteria:** 
    - `getAvailableSlots` strictly queries specific dates without invalid open-schedule OR leaks
    - Schedule creation validates against existing schedules to prevent time overlaps on the same date
    - Double-clicking calendar day cells auto-fills the target date in the schedule creation form
    - Appointments tab supports real-time search, status filtering, date filtering, and pagination
    - Owners directory cards display pet counts, visit counts, and an active appointment preview with search and pagination
    - Appointment Detail page features a clean 2-tab view (Pets Details & Appointment History) with timeline tracking and owner metrics

## **PHASE 3: Clinical workspace and signed records**

**Exit state:** Veterinarians can safely complete, sign, amend, print, and review longitudinal clinical records without altering signed history.

- [x] **[P3.1] Implement encounter, prescription, signing, amendment, and RLS foundations**
  - **Goal:** Add the clinical schema and service rules for encounters, notes, diagnoses, treatments, prescriptions, draft editing, signing authority, append-only amendments, and role-aware RLS.
  - **Dependencies:** [P2.3].
  - **Acceptance criteria:** Veterinarians can read the clinic history required for care, edit only permitted drafts, sign encounters and prescriptions, and create linked amendments; signed records are not directly editable; service/RLS tests prove clinical visibility, draft editing, signing, prescription authority, and amendment boundaries.

- [x] **[P3.2] Deliver veterinarian encounter workspace and pet history**
  - **Goal:** Build the veterinarian dashboard and encounter workspace for today's visits, longitudinal pet history, questionnaire data, clinical notes, diagnoses, treatments, and prescriptions.
  - **Dependencies:** [P3.1].
  - **Acceptance criteria:** The workflow opens from appointment/check-in context; history is ordered and readable; questionnaire, note, diagnosis, treatment, and prescription data are tied to the encounter; draft recovery, validation, saving, loading, and error states are clear.
  - **Requested Revisions (Post-P3.2 Verification):**
    - Update the appointment status flow and ENUMs to exclusively use: `Booked`, `Diagnosed`, `Completed`, and `Cancelled`.
    - When an owner creates an appointment, its status is `Booked`.
    - When a veterinarian signs/locks the clinical record, its status changes to `Diagnosed`.
    - When paid (future billing module), status will change to `Completed`.
    - On the Appointment Detail view, replace the placeholder "Print Details" with a "View/Edit Encounter" button that links back to the Encounter Workspace if a draft or signed record exists.

- [x] **[P3.3] Deliver print-ready clinical record and prescription views**
  - **Goal:** Provide authorized staff with print-optimized clinical-record and prescription documents.
  - **Dependencies:** [P3.2].
  - **Acceptance criteria:** Documents contain accurate patient, veterinarian, clinical, prescription, signature, and amendment data; print layouts do not require a server-side PDF engine unless later approved; owner-facing medical visibility remains filtered by permission.

## **PHASE 4: Billing, cash payments, and receipts**

**Exit state:** Admins can issue itemized invoices, record cash payments, print receipts, and correct mistakes without rewriting financial history.

- [x] **[P4.1] Implement billing rules, ledger schema, numbering, RLS, and integrity checks**
  - **Goal:** Finalize MVP tax/receipt/correction decisions, then model invoices, items, payments, payment corrections, receipts, sequential numbering, and financial RLS.
  - **Dependencies:** [P3.1], [P2.1].
  - **Acceptance criteria:** Invoice and receipt numbering is separate, sequential, atomic, and server-side; invoice states and transitions are documented; payments are append-only; minimum correction records preserve original payments; billing RLS and integrity tests prove non-admins cannot change payment history and duplicate numbers are prevented.

- [x] **[P4.2] Deliver invoice, cash payment, and receipt workflow**
  - **Goal:** Let admins create itemized invoices, record in-clinic cash payments, and generate linked receipts from one protected workflow.
  - **Dependencies:** [P4.1].
  - **Acceptance criteria:** Totals are calculated server-side; line items are validated; invoices can relate to pets, appointments, or encounters without exposing unrelated data; payment amount, method, time, notes/reference, and recording admin are retained; partial and paid statuses are accurate.

- [x] **[P4.2.1] Implement transactional billing emails for owners**
  - **Goal:** Add HTML email templates in `docs/supabase/email-templates/` and configure email delivery to automatically notify pet owners when an invoice is created or marked as paid.
  - **Dependencies:** [P4.2].
  - **Acceptance criteria:** HTML templates are saved; invoice creation triggers an "Invoice Created" email with billing details; payment completion triggers an "Invoice Paid / Receipt" email; email sending uses a unified backend service (e.g. Resend HTTP API) and falls back gracefully when the API key is not configured.

- [x] **[P4.3] Deliver minimum correction flow**
  - **Goal:** Provide the MVP correction path for billing mistakes.
  - **Dependencies:** [P4.2].
  - **Acceptance criteria:** Original payments are never edited or deleted; correction reason, actor, time, amount, and linked payment are retained; invoice status reflects corrections.

- [x] **[P4.4] Schema streamlining, bug remediation, and UI refinement**
  - **Goal:** Clean up confusing and unused database entities (prune `notifications`, `check_ins`, and `payment_corrections`), resolve clinical and pet navigation bugs, eliminate SSR hydration mismatches, and upgrade pet and billing interfaces to high-end design standards.
  - **Dependencies:** [P4.2], [P3.2].
  - **Acceptance criteria:** Tracked migration `0025_streamline_schema.sql` drops unused tables cleanly; generated types stay in sync; pet profile back navigation correctly retains previous tab state; pet registration provides DOB-to-Age auto-calculation and color input; pet cards and clinical history show compact appointment links; billing interfaces (invoice builder, invoice details, payment modal, invoice list) use cohesive document styling and centered dialogs; all automated tests pass.

## **PHASE 5: Owner portal and MVP release verification**

**Exit state:** Admins have centralized audit logging, owners have a controlled portal for care and billing information, and the core appointment-to-care-to-invoice-to-receipt workflow is verified for MVP release.

- [x] **[P5.1] Deliver Administrator Audit and Activity Logs Tab**
  - **Goal:** Build a centralized, admin-only "Logs" tab and service to monitor clinic operations in real time (appointment status transitions such as diagnosed/confirmed/cancelled, encounter signings, payments recorded, schedule changes, and staff account management).
  - **Dependencies:** [P4.4], [P3.2], [P2.3.2].
  - **Acceptance criteria:** Dedicated "Logs" tab in dashboard navigation visible only to `admin`; chronological searchable and filterable activity table with actor, action type, target entity, timestamp, and details; data aggregation is strictly housed in services; admin-only access guarded by `requireRole(['admin'])`.

- [x] **[P5.2] Deliver owner portal for linked pets, appointments, permitted records, invoices, and receipts**
  - **Goal:** Build the owner home and pet-detail views for linked pets, upcoming appointments, recent activity, permitted clinical records, invoices, receipts, and approved print views.
  - **Dependencies:** [P5.1], [P3.3], [P4.4], [P2.2].
  - **Acceptance criteria:** Medical visibility follows `can_view_medical_records`; financial access follows `pet_owners`; owner views never expose another owner's pets, appointments, records, invoices, or receipts; data aggregation remains in services; empty, loading, error, and print states are complete.

- [x] **[P5.3] Run end-to-end MVP authorization and workflow verification**
  - **Goal:** Verify the owner appointment-to-care-to-invoice-to-receipt journey and all MVP role boundaries with automated and manual acceptance checks.
  - **Dependencies:** [P5.2].
  - **Acceptance criteria:** Tests prove owners cannot access another owner's pets, appointments, encounters, invoices, receipts, or permitted records; admin and veterinarian restrictions hold; migrations and generated types are current; the main clinic workflow is manually verified.

- [x] **[P5.4] Complete MVP usability, production, and handoff review**
  - **Goal:** Review the complete workflow for responsive design, accessibility, print quality, production configuration, and documented operational handoff.
  - **Dependencies:** [P5.3].
  - **Acceptance criteria:** Core workflows work at 375px and clinic desktop widths; interactive controls meet touch-target requirements; unresolved non-MVP ideas are documented rather than implemented.

---

## Notes

- GitHub Project: https://github.com/users/Danncode10/projects/9
- Detailed tasks use stable ordered IDs and are mirrored to real GitHub Issues.
- Post-MVP candidates intentionally excluded from this MVP trim: notification center and reminders, operational reports, advanced exports, online payments, advanced clinical workflows, and broader billing correction/refund tooling beyond the minimum audit-safe correction path.
