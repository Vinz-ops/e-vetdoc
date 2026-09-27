# E-VetDoc Phase 0 handover runbook

Use this runbook in order. Each section maps to one task in `MASTERPLAN.md` and ends with a simple completion check. Do not copy secrets into this file, Git, chat, or screenshots.

## Before you start

The handover developer needs access to:

- The E-VetDoc repository.
- The E-VetDoc Supabase project.
- The E-VetDoc Google Cloud OAuth project.
- A test email inbox they control.

Keep these values in a password manager or approved secret store only: `DATABASE_URL`, Supabase service-role key, Gmail App Password, Google Client Secret, and personal tokens.

## P0.1 — Connect Supabase

**Purpose:** Connect the local app to the correct hosted Supabase project.

### Do this

1. Clone the repository and run:

   ```bash
   pnpm install
   cp .env.example .env.local
   ```

2. Use `.env.example` as the local configuration contract. Ask the project owner to provision the required values through a secure channel; do not add values to this handover guide.
3. The developer must set these variables in their own untracked `.env.local` file:

   | Variable | Obtain it from |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → Data API |
   | `SUPABASE_PROJECT_ID` | Supabase → Project Settings → General |
   | `DATABASE_URL` | Supabase → Connect |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → Data API; server-only |
   | `NEXT_PUBLIC_SITE_NAME` | Product configuration |
   | `NEXT_PUBLIC_SITE_URL` | Local or production app origin |
   | `SMTP_USER` | Approved clinic Gmail address |
   | `SMTP_PASSWORD` | Gmail App Password |

4. Sync the database schema to the new Supabase project:

   ```bash
   pnpm db:migrate
   ```
   *(This applies all tables, RLS policies, triggers, and storage buckets to the fresh database.)*

5. Run `pnpm dev`, then open `http://localhost:3000/login`.

### Done when

- The database schema is fully synchronized without errors.
- The app starts locally.
- The login page loads without a Supabase configuration error.
- No secret was committed or shared in a ticket.

## P0.2 — Configure email authentication

**Purpose:** Let new users confirm their email and recover their account safely.

### Do this in Supabase

1. Open **Authentication → URL Configuration**.
2. Set **Site URL** to:

   ```text
   http://localhost:3000
   ```

3. Add these **Redirect URLs**:

   ```text
   http://localhost:3000/auth/callback
   http://localhost:3000/reset-password
   ```

4. Open **Authentication → Providers**. Keep email/password enabled and require email confirmation for new owner accounts.
5. Open **Authentication → Emails → SMTP Settings**:
   - Enable **Custom SMTP**.
   - Host: `smtp.gmail.com`
   - Port: `465`
   - Username: approved clinic Gmail address
   - Password: Gmail App Password
   - Sender: approved clinic email and E-VetDoc display name
6. Open **Authentication → Emails → Templates**. Paste the repository HTML into the matching template:

   | Supabase template | Subject | File to copy |
   | --- | --- | --- |
   | Confirm sign up | `Confirm your E-VetDoc email` | [`confirm-signup.html`](../supabase/email-templates/confirm-signup.html) |
   | Reset password | `Reset your E-VetDoc password` | [`reset-password.html`](../supabase/email-templates/reset-password.html) |

   Keep `{{ .ConfirmationURL }}` unchanged in both templates.

### Test it

1. Create a new account with a fresh inbox.
2. Open the confirmation email and confirm it returns to the app.
3. Request a password reset, use the newest email, set a new password, and sign in.

### Done when

Confirmation and reset emails arrive, their links work, and the new password can sign in.

## P0.3 — Preserve the approved E-VetDoc UI

**Purpose:** Keep the calm clinic-oriented visual direction intact while the project changes hands.

### Do this

1. Read `PROJECT_CONTEXT.md` before changing copy, theme, or UI.
2. Preserve the existing page structure, navigation, login behavior, and responsive behavior.
3. Use only Tailwind/Shadcn semantic tokens; do not add hard-coded color utility classes.
4. Check `/login` at mobile width (375px) and desktop width after UI changes.

### Done when

The landing and login screens still use E-VetDoc copy and are readable, responsive, and functional.

## P0.4 — Configure Google sign-in

**Purpose:** Allow an approved Google account to sign in through Supabase and reach `/dashboard`.

### A. Do this in Google Cloud

1. Select the dedicated **E-VetDoc Google OAuth** project; do not use a project belonging to another product.
2. Search for **Google Auth Platform**.
3. In **Branding**, set the E-VetDoc name, support email, and developer contact email.
4. In **Audience**:
   - Use **External**.
   - Keep the status **Testing**. Do not click **Publish app**.
   - Under **Test users**, add the Gmail account used for testing.
   - If Google says the account is ineligible but it already appears in the Test users table, close the error: it is already added.
5. In **Data Access**, make sure `openid` is present. Do not add sensitive or restricted scopes.
6. In **Clients**, create a client:

   | Field | Value |
   | --- | --- |
   | Application type | Web application |
   | Name | `E-VetDoc local development` |
   | Authorized JavaScript origin | `http://localhost:3000` |
   | Authorized redirect URI | Copy the callback URL shown by Supabase Google provider; format: `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback` |

7. Copy the Client ID and Client Secret. Keep the secret private.

### B. Do this in Supabase

1. Open **Authentication → Providers → Google**. Some dashboard versions call this **Sign In / Providers**.
2. Enable **Sign in with Google**.
3. Paste the Google Client ID and Client Secret, then click **Save**.
4. Recheck **Authentication → URL Configuration** contains:

   ```text
   Site URL:      http://localhost:3000
   Redirect URL:  http://localhost:3000/auth/callback
   Redirect URL:  http://localhost:3000/reset-password
   ```

### C. Test it

1. Run `pnpm dev`.
2. Open `http://localhost:3000/login`.
3. Click **Continue with Google** and choose a Google OAuth test user.
4. Confirm the browser ends at `/dashboard`.

### Important distinction

Google Cloud needs the **Google → Supabase** URL shown by the Supabase Google provider:

```text
https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
```

Supabase needs the **Supabase → app** URL:

```text
http://localhost:3000/auth/callback
```

Do not swap these URLs.

### Done when

An account listed as a Google test user reaches `/dashboard` after clicking **Continue with Google**.

### E-VetDoc verification record

Completed on 2026-08-14. A permitted Google test user successfully signed in through Google and Supabase and reached `/dashboard`. No OAuth credential or environment value is recorded in this repository.

## P0.5 — Hand over hero media

**Purpose:** Deliver approved visual assets without changing the existing hero behavior by accident.

### Deliver these files

```text
public/hero-poster.avif
public/hero-background.webm
public/hero-background.mp4
```

Also hand over the asset source, licence/usage confirmation, intended desktop/mobile crop, and concise alt text. Review the hero on mobile and desktop, including reduced-motion fallback.

### Done when

The hero text remains readable, the subject survives the mobile crop, and the supplied media has approved usage rights.

## P0.6 — Final quality review

**Purpose:** Catch launch blockers after authentication and hero work are complete.

### Run

```bash
pnpm lint
pnpm build
```

Then check:

- `/login` works on mobile and desktop.
- Email confirmation, password reset, and Google sign-in reach the correct destination.
- No secrets appear in Git, logs, or screenshots.
- The landing page has clear E-VetDoc messaging and accessible image text.

Record any failure as a GitHub issue. Do not mark the review complete based only on a visual glance.

### Done when

The checks pass or every known failure has an assigned follow-up issue.

## P0.7 — Keep this runbook current

When a setting, provider, URL, or workflow changes, update this file in the same pull request. Never add credentials. Update the status of the matching `MASTERPLAN.md` task and GitHub Project card when the work is actually complete.

## P0.8 — Deploy E-VetDoc on Vercel and connect authentication

**Purpose:** Publish the app safely and register its final HTTPS origin with every authentication provider that sends users back to the app.

### Before you deploy

1. Run the production checks locally:

   ```bash
   pnpm lint
   pnpm build
   ```

2. Choose one **canonical production origin**. Prefer a verified custom domain, such as `https://app.example.com`. If one is not ready, use the Vercel production URL, such as `https://e-vetdoc.vercel.app`, temporarily. Do not use a branch or commit preview URL as the production origin.
3. Keep the origin exact: HTTPS, no path, and no trailing slash in dashboard fields. In this section, replace `<PRODUCTION_ORIGIN>` with that value.

### A. Create the Vercel project

1. In Vercel, choose **Add New → Project**, import the E-VetDoc Git repository, and select the correct team/account.
2. Confirm Vercel detects **Next.js**. Keep the repository root as the Root Directory unless the app later moves into a monorepo subdirectory.
3. Before deploying, open **Project → Settings → Environment Variables**. Copy only the required deployment runtime values from your private `.env.local`; never upload or copy the entire file, commit it, or share its values in chat.
4. Add the variables below to **Production**. Add the same safe runtime values to **Preview** only when preview deployments need to authenticate against this Supabase project.

   | Variable | Vercel environment | Notes |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Production; Preview if tested | Safe to expose to the browser; must stay `https://zmdtwhqirmkptzobufio.supabase.co`. Never replace it with the Vercel app URL. |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production; Preview if tested | Safe to expose to the browser; use the publishable/anon key. |
   | `SUPABASE_SERVICE_ROLE_KEY` | Production only, unless a protected preview needs it | Secret; never prefix it with `NEXT_PUBLIC_`. |
   | `NEXT_PUBLIC_SITE_NAME` | Production; Preview if tested | `E-VetDoc`. |
   | `NEXT_PUBLIC_SITE_URL` | Production | Copy the current `.env.local` value for the initial deployment; after Vercel gives the production domain, replace it with `<PRODUCTION_ORIGIN>`. This app reads it for its canonical site configuration. |
   | `NEXT_PUBLIC_GITHUB_URL` | Production; Preview if tested | Product/project GitHub URL, if the existing configuration uses it. |
   | `UPSTASH_REDIS_REST_URL` | Production when rate limiting is enabled | Server-only secret value. |
   | `UPSTASH_REDIS_REST_TOKEN` | Production when rate limiting is enabled | Server-only secret value. |
   | `SMTP_USER` | Production | Secret; approved clinic Gmail address for sending emails. |
   | `SMTP_PASSWORD` | Production | Secret; Gmail App Password for sending emails. |

   Do **not** add `DATABASE_URL`, `SUPABASE_PROJECT_ID`, or GitHub Project board variables unless a future Vercel build or runtime feature explicitly reads them. Migrations run from the controlled local/CI workflow, not during a Vercel app deployment.
5. Click **Deploy**. Once it succeeds, open the production deployment and copy its domain. If you later add a custom domain in **Project → Settings → Domains**, make that custom HTTPS domain the canonical origin and repeat sections B–D with it.

### Required post-deployment URL handoff

The first successful Vercel deployment reveals the production domain; it does **not** complete P0.8. As soon as the domain is known, complete these actions before calling the deployment ready:

1. The initial deployment uses the current `NEXT_PUBLIC_SITE_URL` copied from `.env.local`. In **Vercel → Project → Settings → Environment Variables**, replace only that Production value with the complete production origin including `https://` (for example, `https://e-vetdoc-chi.vercel.app`), then redeploy production. Do not change `NEXT_PUBLIC_SUPABASE_URL`: it must remain `https://zmdtwhqirmkptzobufio.supabase.co`. The deployment that first revealed the URL cannot contain this replacement value.
2. Complete sections B and C below with that same exact origin.
3. Complete the three production authentication tests in section D.

Current E-VetDoc deployment record (2026-08-17):

| Item | Value / status |
| --- | --- |
| Canonical production origin | `https://e-vetdoc-chi.vercel.app` |
| Vercel `NEXT_PUBLIC_SITE_URL` | Pending confirmation |
| Supabase production URL configuration | Pending confirmation |
| Google Cloud production JavaScript origin | Added to the existing Web application client on 2026-08-17 |
| Production authentication tests | Pending |

### B. Register the deployed origin in Supabase

1. Open **Supabase → Authentication → URL Configuration**.
2. During testing, keep **Site URL** as `http://localhost:3000` when local development is the intended fallback. This does not prevent production testing when the production redirect URLs below are allow-listed. Set Site URL to the complete `<PRODUCTION_ORIGIN>` only when production becomes the intended public-launch fallback for authentication emails and templates. It must include `https://`; a bare domain is invalid.

3. Add these exact **Redirect URLs** while retaining the localhost URLs for development:

   ```text
   <PRODUCTION_ORIGIN>/auth/callback
   <PRODUCTION_ORIGIN>/reset-password
   ```

4. For Vercel previews, add this only if preview authentication is intentionally supported; replace the placeholder with the actual Vercel team or account slug:

   ```text
   https://*-<VERCEL_TEAM_OR_ACCOUNT_SLUG>.vercel.app/**
   ```

   Keep production URLs exact. Do not use a broad wildcard for the production domain.

### C. Register the deployed origin in Google Cloud

1. In Google Cloud, search for **Google Auth Platform**, open **Clients**, then open the existing E-VetDoc **Web application** client.
2. Under **Authorized JavaScript origins**, click **Add URI** and add:

   ```text
   <PRODUCTION_ORIGIN>
   ```

3. Leave the **Authorized redirect URI** pointed to Supabase, then click **Save**:

   ```text
   https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
   ```

   Do not add `<PRODUCTION_ORIGIN>/auth/callback` as a Google redirect URI. Google returns to Supabase first; Supabase then returns to the app callback URL allow-listed in section B.
4. If the production domain is custom, add it to **Google Auth Platform → Branding → Authorized domains** when the dashboard requires it, then complete any required brand verification before a public launch.

### D. Redeploy and verify

1. Redeploy the Vercel production deployment after changing environment variables; Vercel applies new values only to newly created deployments.
2. At `<PRODUCTION_ORIGIN>`, test with accounts and an inbox you control:
   - Sign up and confirm the email returns to the app.
   - Request a password reset and complete it.
   - Use **Continue with Google** and confirm the user reaches `/dashboard`.
3. In Vercel, inspect the deployment logs for configuration errors. Do not paste credentials into logs, tickets, or screenshots.

### Done when

The canonical production URL is deployed, its Vercel production variables are configured, and all three authentication flows return to the intended production app route.

### Deployment URL map

| Platform | Setting | Value |
| --- | --- | --- |
| Vercel | `NEXT_PUBLIC_SUPABASE_URL` | `https://zmdtwhqirmkptzobufio.supabase.co` — never the production app URL |
| Vercel | `NEXT_PUBLIC_SITE_URL` (Production) | `<PRODUCTION_ORIGIN>` |
| Supabase | Site URL | Keep the intended fallback during testing; set `<PRODUCTION_ORIGIN>` at public launch |
| Supabase | Redirect URLs | `<PRODUCTION_ORIGIN>/auth/callback`, `<PRODUCTION_ORIGIN>/reset-password` |
| Google Cloud | Authorized JavaScript origin | `<PRODUCTION_ORIGIN>` |
| Google Cloud | Authorized redirect URI | `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback` |

## Helpful references

- [`MASTERPLAN.md`](../../MASTERPLAN.md)
- [`PROJECT_CONTEXT.md`](../../PROJECT_CONTEXT.md)
- [`social-auth.md`](../dannflow_docs/social-auth.md)
- [`auth-redirect-and-email-setup.md`](../supabase/auth-redirect-and-email-setup.md)
