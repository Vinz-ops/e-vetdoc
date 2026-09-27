# Phase 0 quality review — E-VetDoc

Reviewed: 2026-08-16

## Completed in [P0.6]

- Replaced stale DannFlow metadata with E-VetDoc's product title and description.
- Added a root canonical URL, Open Graph and Twitter metadata, and a generated 1200×630 social-sharing image.
- Added `WebApplication` JSON-LD to the homepage.
- Removed the authenticated dashboard from the public sitemap and marked dashboard and account-recovery routes as non-indexable.
- Replaced misleading and dead marketing links with links to the relevant on-page content or sign-in flow.
- Removed unconfigured clinic, legal, and support placeholder links from the footer.

## Verification results

- Next.js compilation completed successfully.
- Full production build is currently blocked by a pre-existing ProseMirror type-resolution conflict in `src/components/dashboard/blog-editor-page.tsx` at line 775. The conflict is between two installed `prosemirror-model` type instances.
- ESLint currently reports 12 pre-existing errors across dashboard, profile, and animation components. No errors were reported in the files changed for this task.

## Follow-up work before or during [P0.8]

- Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS production domain before deployment; this supplies the canonical and Open Graph base URL.
- Check the deployed homepage using Google Rich Results Test and Google Search Console after the production domain is live.
- Add real clinic contact details, legal pages, and support information once approved. Do not publish fabricated testimonials, logos, ratings, or performance claims; the homepage intentionally makes no unsupported social-proof claims.
- Resolve the existing ProseMirror dependency/type conflict and lint errors before treating the production build as release-ready.
