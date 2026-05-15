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

## Translations (i18n) — author now, display later

The schema is fully translation-ready: `landing-page` and the 4 `page-*`
types are `i18n.localized: true` at the content-type level **and on every
attribute** (per-field). No further schema/code change is needed to author
translations.

Two setup steps remain — by Strapi's design these are environment/admin
actions, not repo code:

- [ ] **A. Pin the default locale to `ro`.** Set the documented env var on
      the instance:
      `STRAPI_PLUGIN_I18N_INIT_LOCALE_CODE=ro`
      (Strapi's built-in default is `en`; the frontend sends no `locale`
      param yet, so the default MUST be `ro` or the live site flips to an
      empty `en`.) Effective when locales initialize; verify in
      Settings → Internationalization that `ro` shows as **Default**.
- [ ] **B. Add the `en` locale (one click).** Admin → Settings →
      Internationalization → **Add new locale** → `en` → do **NOT** tick
      "Set as default" → Save. Strapi exposes no stable programmatic API
      for this (it's an admin-panel action by design), so it is not
      codified — intentionally, to avoid risky boot logic.

After A + B you can author `en` translations per entry in the Content
Manager immediately. They will **not appear on hulubul.com** until the
frontend i18n epic (locale routing + `?locale=` in `getLandingPage` /
`getEditorialPage` + fallback) — that is the "display later" half and is
frontend work, tracked in the FE spec.

> Re-seeding (`npm run seed:landing-page`, `seed:editorial-pages`) only
> writes the `ro` (default) locale, so it never overwrites translations.

## Out of scope here (tracked separately)

- CORS allowlist for `https://hulubul.com` on client-side read endpoints
  (`config/middlewares.js`).

## Notes on intentional spec deviations (no backend action)

These were deliberate, locked decisions; the frontend adapts (FE-3):

- `body` is Strapi 5 **blocks** (not markdown) — FE uses
  `@strapi/blocks-react-renderer`.
- `lastUpdated` is a **date (ISO)** — FE formats to RO display.
- SEO is the **`shared.seo` component** (not flat fields) — consistent with
  `landing-page`; callers must `populate[seo][populate]=shareImage`
  (same pattern as `buildLandingPopulate`).
