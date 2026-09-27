# MVP Operational Handoff & Production Guide — E-VetDoc

> **Date:** September 1, 2026  
> **System:** E-VetDoc Veterinary Management System (Single-Clinic SaaS MVP)  
> **Status:** Production-Ready (Phases 0–5 Completed)

---

## 1. System Architecture & Overview

E-VetDoc is an end-to-end veterinary clinic management platform built on **Next.js 16 (App Router)** and **Supabase (PostgreSQL + Auth + Storage)**. It orchestrates the full patient lifecycle: pet registration, Google Calendar-style appointment capacity scheduling, clinical care encounters, append-only diagnostic signing, sequential 12% VAT invoicing and cash receipts, real-time administrative audit logs, and an isolated pet owner portal.

### Core Technology Stack
- **Framework:** Next.js 16.2.9 (App Router, Turbopack, React Server Components)
- **Database & Auth:** Supabase PostgreSQL 15+ with Row-Level Security (RLS) enabled on all tables
- **ORM & Schema:** Drizzle ORM (`db/schema/*.ts`) with tracked migrations in `db/migrations/`
- **Styling & UI:** Tailwind CSS + Shadcn/UI primitives + Lucide Icons
- **Type Safety:** Automated TypeScript definitions synced directly with Supabase (`src/types/supabase.ts`)
- **Email Delivery:** Resend HTTP API & SMTP fallback with branded HTML transactional email templates

---

## 2. Role Model & Authorization Boundaries

The platform enforces a strict three-tier role model managed in `public.profiles`:

| Role | Permissions & Access Scope | Guarded Routes / Tabs |
| :--- | :--- | :--- |
| **`admin`** | Full clinic operational control: staff provisioning, schedule capacity configuration, billing & invoicing, cash payments, receipts, patient registry, system logs & audit trail. | `/dashboard/billing`, `/dashboard/schedules`, `/dashboard/team`, `/dashboard/logs`, `/dashboard/appointments`, `/dashboard/pets`, `/dashboard/owners` |
| **`veterinarian`** | Clinical care operations: view patient records, manage daily appointment queue, author and sign clinical encounters, diagnoses, treatments, prescriptions, and print records. | `/dashboard/appointments`, `/dashboard/encounters/[id]`, `/dashboard/pets`, `/dashboard/owners` |
| **`owner`** | Pet owner self-service portal: view linked pets, request/book appointments into open capacity slots, view signed medical records (if authorized), view itemized invoices, and print receipts. | `/dashboard` (Owner Portal), `/dashboard/appointments/new`, `/dashboard?tab=pets`, `/dashboard?tab=appointments`, `/dashboard?tab=billing` |

### Multi-Tenant & Data Isolation Rules
1. **Ownership Link (`pet_owners`):** Owners can only view pets where a row exists linking their `profile_id` to the `pet_id`.
2. **Medical Privacy (`can_view_medical_records`):** Clinical notes and encounters are only exposed to owners if `can_view_medical_records` is `true` for that pet-owner link.
3. **Financial Isolation:** Invoices and receipts are strictly filtered by the owner's linked pets. Owners cannot view, edit, or access invoices belonging to other pet owners.

---

## 3. End-to-End Clinic Lifecycle & Workflows

### 3.1 Appointment Scheduling & Capacity
- **Admin Schedule Management:** Admins create date-specific schedules with predefined start/end times and slot capacity (e.g. max 3 patients per 30-minute block).
- **Conflict Prevention:** System validates schedule creation against existing schedules to prevent time overlaps on the same day.
- **Booking Flow:** Owners select their pet, pick an available day via an interactive calendar, choose an open slot with remaining capacity, and book directly. Status initializes as `Booked`.

### 3.2 Clinical Encounters & Medical Documentation
- **Encounter Workspace:** Veterinarians open appointments from the queue and document history, physical examination findings, diagnoses, treatments, and prescriptions.
- **Append-Only Signing:** Once signed, encounter notes, diagnoses, and treatments are locked and non-editable.
- **Status Progression:** Signing an encounter automatically advances the appointment status from `Booked` → `Diagnosed`.

### 3.3 Billing, 12% VAT, Payments & Receipts
- **Sequential Invoicing:** Invoices generate server-side sequential numbers (`INV-YYYY-XXXX`).
- **12% VAT Breakdown:** Automatic computation of Gross, 12% VAT Tax, and Net amounts.
- **Cash Recording:** Admins record cash payments; payments are strictly append-only.
- **Sequential Receipts:** Completed payments generate official receipts (`RCPT-YYYY-XXXX`).
- **Status Progression:** Recording full payment automatically transitions the appointment status from `Diagnosed` → `Completed`.

### 3.4 Audit Trail & Operational Logging
- **Activity Logging:** Real-time logging of all critical clinic events: appointment status transitions, encounter signings, invoice creations, and cash payment recordings.
- **Admin Visibility:** Dedicated `/dashboard/logs` tab with full-text search, action type filtering, and actor attribution.

---

## 4. Environment Variables & Production Configuration

The following environment variables are required in `.env.local` (and Vercel Production Settings):

```bash
# App Configuration
NEXT_PUBLIC_SITE_URL="https://e-vetdoc.vercel.app"
PORT=3000

# Supabase Connection
NEXT_PUBLIC_SUPABASE_URL="https://zmdtwhqirmkptzobufio.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<SUPABASE_ANON_KEY>"
SUPABASE_SERVICE_ROLE_KEY="<SUPABASE_SERVICE_ROLE_KEY>"
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Transactional Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="E-VetDoc Clinic <notifications@e-vetdoc.com>"
```

### Production Checklist
1. **Supabase Auth Redirects:** Verify that `https://<YOUR_VERCEL_DOMAIN>/auth/callback` and `https://<YOUR_VERCEL_DOMAIN>/dashboard` are added to Supabase **URL Configuration → Redirect URLs**.
2. **Google OAuth:** Ensure Google Cloud Console Web Client has the production URI `https://zmdtwhqirmkptzobufio.supabase.co/auth/v1/callback` in authorized redirect URIs.
3. **Database Migration State:** Run `pnpm db:migrate` or verify that all migrations up to `0025_streamline_schema.sql` are applied in production.
4. **Vercel Build Command:** Ensure Next.js build uses `pnpm build`.

---

## 5. Maintenance & Operational Procedures

### 5.1 Routine Database Migrations
Always author schema changes in `db/schema/*.ts`.
```bash
# 1. Generate SQL migration
pnpm db:generate

# 2. Review generated migration file in db/migrations/

# 3. Apply migration to Supabase
pnpm db:migrate

# 4. Sync TypeScript types
pnpm db:types
```

### 5.2 Database Backups & Schema Checkpoints
To take a snapshot checkpoint of the live Supabase schema:
```bash
pnpm checkpoint
```
The snapshot will be saved into `supabase/backups/`.

### 5.3 Automated Verification Suite
Run the full verification suite before any production deployment:
```bash
# TypeScript verification
npx tsc --noEmit

# End-to-end authorization and workflow verification
npx tsx scripts/verify-p5.3.ts

# Production build validation
pnpm build
```

---

## 6. Documented Non-MVP Backlog (Post-MVP Roadmap)

The following items were explicitly scoped as post-MVP enhancements and documented for future development cycles:
1. **Online Payment Gateways:** Integration with Stripe / PayMongo for credit card and e-wallet payments.
2. **SMS & Push Notifications:** Automated SMS appointment reminders via Twilio or Semaphore.
3. **Multi-Branch / Multi-Clinic Architecture:** Tenant isolation by clinic organization ID for multi-branch veterinary hospital groups.
4. **Advanced Inventory & Stock Management:** Drug, consumable, and retail product inventory depletion upon prescription fulfillment.
5. **Lab Equipment & DICOM Imaging Integration:** Direct attachment of X-ray, ultrasound, and blood analyzer digital reports to encounters.
