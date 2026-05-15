# Deploy Runbook — i18n / SEO / waitlist dedupe

Companion to PR #7. The code changes are necessary but **not sufficient** —
the steps below MUST be performed in the live Strapi instance, in order.
Skipping or reordering step 1 breaks every waitlist submission.

## ⛔ Hard prerequisite (blocks frontend PR #16 / FE-3)

The frontend authenticates with a **custom Bearer API token**
(`Authorization: Bearer ${STRAPI_API_TOKEN}`), **not** the Authenticated
users-permissions role. The codified `ensureWaitlistServerPermissions()`
bootstrap only grants the *Authenticated role* — it is harmless and
idempotent but **does NOT cover the token the frontend actually uses**.

Therefore, before merging/deploying frontend PR #16 or FE-3:

- [ ] **1. Grant the frontend API token its permissions.**
      Admin → Settings → API Tokens → (the token used by the frontend) → set:
  - [ ] `waitlist-submission`: **`create`** + **`find`**
        (`find` is required by the PR #16 soft-dedupe `$eqi` pre-check;
        without it every submission fails AUTH_MISCONFIG)
  - [ ] `landing-page`: **`find`**
  - [ ] `page-confidentialitate`, `page-termeni`, `page-despre-proiect`,
        `page-pentru-transportatori`: **`find`** (single types → `find`)
- [ ] **2. Keep public/unauthenticated `find` on `waitlist-submission`
      DISABLED.** It holds PII (emails, locations). Public stays
      **create-only** — enforced by `WAITLIST_PUBLIC_ACTIONS`.

> Deploy order is a hard constraint: **backend perms live → then merge/deploy
> the frontend.** Out of order = every submission AUTH_MISCONFIG-fails.

## Migrations & content

- [ ] **3. Run migrations / restart** so
      `2026.05.15T00.00.00.waitlist-submission-indexes.js` applies
      (indexes `waitlist_submissions.email` + `created_at`, backing the
      dedupe pre-check).
- [ ] **4. Publish content** with the `seo` component filled
      (real `metaTitle` without the brand suffix, `metaDescription`,
      `shareImage`):
  - [ ] `landing-page` — `npm run seed:landing-page`
  - [ ] The 4 editorial pages — `npm run seed:editorial-pages`
        (idempotent; upserts + publishes `page-confidentialitate`,
        `page-termeni`, `page-despre-proiect`,
        `page-pentru-transportatori` in the `ro` locale from
        `data/editorial-pages.json` + `data/editorial/*.md`, markdown
        converted to Blocks). `shareImage` is optional and can be set
        per page in the admin afterward.

## Out of scope here (tracked separately)

- CORS allowlist for `https://hulubul.com` on client-side read endpoints
  (`config/middlewares.js`).
- Adding extra i18n locales (schema is `localized:true`, default locale
  only — locales are added in the Strapi UI when needed, no code change).

## Notes on intentional spec deviations (no backend action)

These were deliberate, locked decisions; the frontend adapts (FE-3):

- `body` is Strapi 5 **blocks** (not markdown) — FE uses
  `@strapi/blocks-react-renderer`.
- `lastUpdated` is a **date (ISO)** — FE formats to RO display.
- SEO is the **`shared.seo` component** (not flat fields) — consistent with
  `landing-page`; callers must `populate[seo][populate]=shareImage`
  (same pattern as `buildLandingPopulate`).
