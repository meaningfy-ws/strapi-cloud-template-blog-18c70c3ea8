# Plan — Waitlist submission v2 (backend)

> Date: 2026-04-27
> Spec: `design/spec-waitlist-submission.md` (v2, 2026-04-27 revision).
> Frontend companion: `design/spec-waitlist-frontend.md` (separate repo).
> Scope: this Strapi repo only. Frontend changes tracked separately.

## Context

The v2 spec adds 9 new fields, a deprecated enum value, lifecycle validation
for GDPR consent + structured `cities`, and a CORS lock-down. The frontend
contract (Next.js `/api/waitlist` handler with honeypot + rate limit) lives
in the `hulubul-front` repo and is **not** part of this plan; it is referenced
only as the consumer of these changes.

Existing files touched:

- `src/api/waitlist-submission/content-types/waitlist-submission/schema.json`
- `src/api/waitlist-submission/content-types/waitlist-submission/lifecycles.js`
- `tests/schemas/waitlist-submission.test.js`
- `config/middlewares.js`

New files:

- `tests/lifecycles/waitlist-submission.lifecycle.test.js`
- (no new source files — the default factory controller/service stay)

## Sequencing principle

Schema → lifecycles → tests → middleware → admin steps. Each step should be
green before the next starts, so a partial deploy still leaves the
collection valid.

---

## Step 1 — Update content-type schema

**File:** `src/api/waitlist-submission/content-types/waitlist-submission/schema.json`

Add the new fields and adjust the existing ones. Preserve `kind`,
`collectionName`, `info`, `options`, and `pluginOptions` blocks unchanged.

**Attribute changes:**

| Attribute | Action | Resulting definition |
|---|---|---|
| `name` | edit | `{ "type": "string", "required": true, "maxLength": 200 }` |
| `email` | unchanged | `{ "type": "email", "required": true }` |
| `whatsapp` | unchanged | `{ "type": "string", "required": false }` |
| `role` | edit enum | `{ "type": "enumeration", "enum": ["expeditor", "transportator", "ambele", "destinatar"], "required": true, "default": "expeditor" }` |
| `routes` | demote | `{ "type": "string", "required": false, "maxLength": 500 }` |
| `cities` | **add** | `{ "type": "json", "required": false }` |
| `source` | **add** | `{ "type": "enumeration", "enum": ["landing", "qr_event", "referral", "other"], "required": false, "default": "landing" }` |
| `location` | **add** | `{ "type": "json", "required": false }` |
| `locationConsent` | **add** | `{ "type": "enumeration", "enum": ["granted", "denied", "not_asked"], "required": false, "default": "not_asked" }` |
| `device` | **add** | `{ "type": "json", "required": false }` |
| `gdprConsent` | **add** | `{ "type": "boolean", "required": true, "default": false }` |
| `gdprConsentAt` | **add** | `{ "type": "datetime", "required": true }` |
| `gdprConsentVersion` | **add** | `{ "type": "string", "required": true, "maxLength": 64 }` |
| `utm` | **add** | `{ "type": "json", "required": false }` |

**GitNexus check before editing:**

```
gitnexus_impact({ target: "schema.json", direction: "upstream", repo: "strapi-cloud-template-blog-18c70c3ea8" })
```

Expect d=1 hits in the schema test only.

**Migration concern:** existing rows in production are missing `gdprConsent`,
`gdprConsentAt`, `gdprConsentVersion` even though they are required.
Strapi 5 backfills required fields on schema sync **only if a default is
set**. We cannot set a meaningful default for `gdprConsentAt`. Mitigation:

- Run a **one-time admin script** (`scripts/backfill-waitlist-consent.js`,
  see Step 6) before publishing the schema change to production. The script
  stamps existing rows with `gdprConsent: true`, `gdprConsentAt` = the row's
  `createdAt`, `gdprConsentVersion: "pre-2026-04-27"`. Justification: those
  rows were submitted under the prior privacy notice, which we treat as the
  v0 consent text. Recorded under a distinct version string so we can audit.

**Acceptance:** `npm run test:schema` passes after Step 3 updates the test.

---

## Step 2 — Extend lifecycle validation

**File:** `src/api/waitlist-submission/content-types/waitlist-submission/lifecycles.js`

Keep the existing `validateWhatsapp` helper. Add four new helpers and wire
them into `beforeCreate` / `beforeUpdate`. All helpers throw
`errors.ValidationError` with a clear message.

**New helpers:**

```js
const MAX_NAME = 200;
const MAX_CITY = 120;
const MAX_CITIES = 10;
const MAX_CONSENT_VERSION = 64;
const CONSENT_BACKDATE_MS = 60 * 60 * 1000; // 1 hour

function validateName(name) {
  if (typeof name !== 'string') return; // required-check handled by Strapi
  const t = name.trim();
  if (t.length === 0 || t.length > MAX_NAME) {
    throw new errors.ValidationError(
      `name: must be 1..${MAX_NAME} chars after trim`
    );
  }
}

function validateCities(cities) {
  if (cities === undefined || cities === null) return;
  if (!Array.isArray(cities)) {
    throw new errors.ValidationError('cities: must be a JSON array of strings');
  }
  if (cities.length < 1 || cities.length > MAX_CITIES) {
    throw new errors.ValidationError(
      `cities: must contain 1..${MAX_CITIES} entries`
    );
  }
  for (const c of cities) {
    if (typeof c !== 'string' || c.trim().length === 0 || c.length > MAX_CITY) {
      throw new errors.ValidationError(
        `cities: each entry must be a non-empty string ≤ ${MAX_CITY} chars`
      );
    }
  }
}

function validateConsent(data) {
  if (data.gdprConsent !== true) {
    throw new errors.ValidationError(
      'gdprConsent: must be true — explicit consent required'
    );
  }
  const at = data.gdprConsentAt && new Date(data.gdprConsentAt);
  if (!at || Number.isNaN(at.getTime())) {
    throw new errors.ValidationError('gdprConsentAt: must be a valid ISO datetime');
  }
  const now = Date.now();
  if (at.getTime() > now) {
    throw new errors.ValidationError('gdprConsentAt: cannot be in the future');
  }
  if (at.getTime() < now - CONSENT_BACKDATE_MS) {
    throw new errors.ValidationError('gdprConsentAt: too old (max 1 hour back)');
  }
  const v = data.gdprConsentVersion;
  if (typeof v !== 'string' || v.trim().length === 0 || v.length > MAX_CONSENT_VERSION) {
    throw new errors.ValidationError(
      `gdprConsentVersion: must be a non-empty string ≤ ${MAX_CONSENT_VERSION} chars`
    );
  }
}
```

**Wiring:**

```js
module.exports = {
  beforeCreate(event) {
    const { data } = event.params;
    validateName(data.name);
    validateWhatsapp(data.whatsapp);
    validateCities(data.cities);
    validateConsent(data);
  },
  beforeUpdate(event) {
    const { data } = event.params;
    validateName(data.name);
    validateWhatsapp(data.whatsapp);
    validateCities(data.cities);
    // Consent fields are immutable post-create. If any is present in an
    // update payload, reject — never silently mutate the legal record.
    if (
      'gdprConsent' in data ||
      'gdprConsentAt' in data ||
      'gdprConsentVersion' in data
    ) {
      throw new errors.ValidationError(
        'gdpr consent fields are immutable after create'
      );
    }
  },
};
```

**GitNexus check before editing:**

```
gitnexus_impact({ target: "validateWhatsapp", direction: "upstream", repo: "strapi-cloud-template-blog-18c70c3ea8" })
```

Expect d=1: only the lifecycle file's own hook callbacks. Risk: LOW.

**Acceptance:** lifecycle test added in Step 3 covers all branches.

---

## Step 3 — Tests

### 3.1 Schema test

**File:** `tests/schemas/waitlist-submission.test.js` (edit)

Add assertions for every new attribute, the deprecation of `routes`, the
expanded `role` enum, and the `maxLength` cap on `name`.

```js
assertAttribute(t, schema, 'name', { type: 'string', required: true, maxLength: 200 });
assertAttribute(t, schema, 'routes', { type: 'string', required: false, maxLength: 500 });
assertAttribute(t, schema, 'cities', { type: 'json' });
assertAttribute(t, schema, 'location', { type: 'json' });
assertAttribute(t, schema, 'device', { type: 'json' });
assertAttribute(t, schema, 'utm', { type: 'json' });
assertAttribute(t, schema, 'gdprConsent', { type: 'boolean', required: true });
assertAttribute(t, schema, 'gdprConsentAt', { type: 'datetime', required: true });
assertAttribute(t, schema, 'gdprConsentVersion', { type: 'string', required: true, maxLength: 64 });

const role = schema.attributes.role;
t.assert.deepStrictEqual(role.enum, ['expeditor', 'transportator', 'ambele', 'destinatar']);
// `ambele` retained legally during deprecation window — see spec §8.

const source = schema.attributes.source;
t.assert.strictEqual(source.type, 'enumeration');
t.assert.deepStrictEqual(source.enum, ['landing', 'qr_event', 'referral', 'other']);
t.assert.strictEqual(source.default, 'landing');

const lc = schema.attributes.locationConsent;
t.assert.deepStrictEqual(lc.enum, ['granted', 'denied', 'not_asked']);
t.assert.strictEqual(lc.default, 'not_asked');
```

Verify `assertAttribute` already supports `maxLength`. If not, extend
`tests/helpers/schema.js` to assert it (small targeted change).

### 3.2 Lifecycle test (new file)

**File:** `tests/lifecycles/waitlist-submission.lifecycle.test.js` (create)

Mirror the structure of `tests/lifecycles/transporter.lifecycle.test.js`.
Stub `errors.ValidationError`, build `event` objects with `params.data`,
and assert each lifecycle helper.

Cases to cover (one `t.test` per case):

1. **Happy path** — full valid payload, both `beforeCreate` and
   `beforeUpdate` resolve without throwing.
2. **whatsapp invalid** — keeps existing assertion.
3. **name** — empty after trim → throws; > 200 chars → throws.
4. **cities** — non-array → throws; empty array → throws; 11 entries →
   throws; entry too long → throws; valid 1-entry and 10-entry pass.
5. **gdprConsent** — `false` → throws; missing → throws.
6. **gdprConsentAt** — missing → throws; not parseable → throws; future
   timestamp → throws; > 1h old → throws; equals now → passes.
7. **gdprConsentVersion** — missing → throws; empty → throws; > 64 chars
   → throws.
8. **beforeUpdate immutability** — any consent field in update payload →
   throws; update without consent fields passes.

**GitNexus before:**

```
gitnexus_query({ query: "lifecycle test helpers", repo: "strapi-cloud-template-blog-18c70c3ea8" })
```

to confirm the assertion style used elsewhere (`makeEvent`, `ValidationError`
class shape).

### 3.3 Run

```
npm test
```

All schema and lifecycle tests must pass before Step 4.

---

## Step 4 — Lock down CORS

**File:** `config/middlewares.js`

Replace the bare `'strapi::cors'` string with an object form that reads
the allowlist from env. Keep the position in the chain unchanged.

```js
module.exports = ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: env.array('CORS_ALLOWED_ORIGINS', ['http://localhost:3000']),
      methods: ['GET', 'POST', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      credentials: false,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

Note the exported value changes from a static array to a `({ env }) =>`
factory — this is the standard Strapi pattern for env-driven config and is
the same shape `config/server.js` uses.

**Env var to set in Strapi Cloud:**

```
CORS_ALLOWED_ORIGINS=https://hulubul.com,https://www.hulubul.com
```

(Staging gets the staging origin; local dev falls back to the default.)

**Verification:**

- `curl -I -H 'Origin: https://evil.example' https://<strapi>/api/landing-page`
  → no `access-control-allow-origin` header, or its value is not the
  attacker origin.
- `curl -I -H 'Origin: https://hulubul.com' https://<strapi>/api/landing-page`
  → `access-control-allow-origin: https://hulubul.com`.

**GitNexus before:**

```
gitnexus_impact({ target: "middlewares.js", direction: "upstream", repo: "strapi-cloud-template-blog-18c70c3ea8" })
```

Risk: LOW (config file, no internal callers).

---

## Step 5 — Seed permissions: confirm only `create`

**File:** `scripts/seed-landing-page.js`

No code change needed — the script already grants only `create` on
`waitlist-submission` to the public role. Verify this still matches §13
of the spec by re-running:

```
npm run seed:landing-page
```

against a clean staging Strapi, then in the admin UI confirm Public has
**neither** `find` nor `findOne` nor `update` nor `delete`.

If a future change is requested to revoke even `create` (and route writes
through the API token only), update the dictionary in
`scripts/seed-landing-page.js` and re-run.

---

## Step 6 — One-time consent backfill script

**File:** `scripts/backfill-waitlist-consent.js` (create)

Run once on production **before** publishing the schema change with the new
required fields, otherwise existing rows fail validation on next save.

```js
'use strict';

const UID = 'api::waitlist-submission.waitlist-submission';
const VERSION = 'pre-2026-04-27';

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');
  const app = await createStrapi(await compileStrapi()).load();
  app.log.level = 'error';

  try {
    const rows = await app.documents(UID).findMany({ pagination: { limit: -1 } });
    let updated = 0;
    for (const r of rows) {
      if (r.gdprConsent === true && r.gdprConsentAt && r.gdprConsentVersion) continue;
      await app.documents(UID).update({
        documentId: r.documentId,
        data: {
          gdprConsent: true,
          gdprConsentAt: r.createdAt,
          gdprConsentVersion: VERSION,
        },
      });
      updated++;
    }
    console.log(`Backfilled ${updated} waitlist rows.`);
  } finally {
    await app.destroy();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
```

Add an npm script in `package.json`:

```json
"scripts": {
  ...
  "backfill:waitlist-consent": "node scripts/backfill-waitlist-consent.js"
}
```

**Order on production:**

1. Deploy schema PR with new optional fields and bump `gdprConsent*` to
   `required: false` **temporarily**.
2. Run `npm run backfill:waitlist-consent`.
3. Open a follow-up PR flipping `gdprConsent`, `gdprConsentAt`,
   `gdprConsentVersion` to `required: true`.
4. Deploy.

This two-phase deploy avoids the chicken-and-egg of "required field with no
default on existing rows". On a **fresh** Strapi (no existing rows), Step 6
is skipped and the schema can be deployed with `required: true` in a
single PR.

---

## Step 7 — Admin / deploy checklist

Follow `design/strapi-runbook.md`. Order of operations on Strapi Cloud:

1. Merge schema PR (Step 1) and lifecycle PR (Step 2). CI runs Step 3
   tests; do not merge red.
2. Strapi Cloud auto-deploys.
3. In Strapi admin → Content-Type Builder, verify all attributes from §13
   of the spec are present and saved.
4. Settings → API Tokens → confirm the existing waitlist token still has
   `create` (token permissions are per-collection; new fields inherit).
5. Settings → Roles → Public: confirm `find` and `findOne` are off;
   `create` is on (so the public-form path remains, even though the
   frontend now uses the token-authed Next handler — defense in depth).
   *Decision pending:* if we want to **also** revoke public `create`, do
   it here and update Step 5.
6. Set env var `CORS_ALLOWED_ORIGINS` in Strapi Cloud (Step 4).
7. Smoke test: POST a sample payload through the staging Next.js
   `/api/waitlist`; confirm a row lands with `cities` populated, `routes`
   null, consent trio set.
8. (Production only, if rows exist) Run `npm run backfill:waitlist-consent`
   and the follow-up PR (Step 6).

---

## Step 8 — Deprecation cleanup (T+2 weeks)

A separate PR, scheduled 2 weeks after release.

1. Bulk-export historical `routes` strings via Strapi admin → CSV.
   Archive at `data/archive/2026-MM-DD-waitlist-routes.csv` (gitignored).
2. Edit `schema.json`:
   - Remove the `routes` attribute.
   - Remove `"ambele"` from the `role` enum.
3. Update the schema test to drop `routes` and `ambele` assertions.
4. Update the spec: move §8 step 4 details into a "Done" entry under §19
   change notes.

**GitNexus before deletion:**

```
gitnexus_query({ query: "ambele waitlist routes", repo: "strapi-cloud-template-blog-18c70c3ea8" })
gitnexus_impact({ target: "routes", direction: "upstream", repo: "strapi-cloud-template-blog-18c70c3ea8" })
```

Confirm no production code path still reads `routes` or branches on
`role === 'ambele'`.

---

## Acceptance gates (mirrors spec §16)

- [ ] All Step 3 tests green locally and in CI.
- [ ] `npm run seed:landing-page` succeeds on a clean DB.
- [ ] Admin UI shows all new fields, `routes` marked deprecated in its
      description.
- [ ] CORS denies a non-allowlisted Origin.
- [ ] Smoke-test POST returns 201 with the new payload; 400 when
      `gdprConsent: false`.
- [ ] Backfill script (if needed) reports `updated > 0` then 0 on second
      run (idempotent).

---

## Out of scope

- Frontend Next.js `/api/waitlist` handler, honeypot, rate limiter — lives
  in `hulubul-front` repo.
- Survey-collection enum sync (`survey-sender` / `survey-transporter`).
  Tracked separately when the survey epic resumes.
- Webhooks, email notifications on new submission.
- SAR/DSR self-service UI.
