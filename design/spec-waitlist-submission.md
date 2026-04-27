# Waitlist — Backend Spec

> Date: 2026-04-27
> Scope: full backend contract for the waitlist on Strapi Cloud.
> Collection: `api::waitlist-submission.waitlist-submission`.
> Companion doc: `design/spec-waitlist-frontend.md`.
> Related: `design/strapi-runbook.md` (admin/edit flow),
> `design/epic-survey/post-waitlist.md` (shares the role enum — see §9).

---

## 1. Goal

Persist diaspora-side interest in Hulubul before launch, with enough structured
detail to drive (a) launch-day announcements, (b) early matching of senders ↔
transporters ↔ receivers, and (c) qualitative analysis of geographic demand.

The primary upgrade in this iteration is replacing the free-text `routes`
field with a structured, role-aware `cities` array, broadening the role enum
(see §3, §4), and making consent/analytics/abuse-protection first-class.

---

## 2. Architecture & invariants

```
Browser ──POST {payload}──▶ Next.js /api/waitlist ──Bearer──▶ Strapi /api/waitlist-submissions
```

- The browser **never** talks to Strapi directly. `STRAPI_API_TOKEN` lives on
  the Next.js server only (`lib/strapi.ts` in the frontend repo).
- Public `create` on `waitlist-submission` is **disabled** in Strapi (Settings
  → Roles → Public). Only the API token grants `create`.
- `find` on `waitlist-submission` is **disabled** for Public.
- The Next.js route handler is a thin proxy + Zod validator + error mapper.
  It never persists state of its own.
- CORS is locked to landing-page origins only; the Strapi origin does not
  serve the form directly.

---

## 3. Collection schema

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✓ | Trimmed; `maxLength: 200`. |
| `email` | email | ✓ | Strapi's email type validates shape. Lowercased on the frontend before send. **No uniqueness constraint** — duplicates are allowed (resolved downstream). |
| `whatsapp` | string | – | Optional. Free format (+ digits, spaces). Validated by lifecycle (see §3.1). |
| `role` | enum | ✓ | See §4. |
| `cities` | json | – | Ordered array of city strings — see §5. Optional at the schema level so partial submissions land; required by the **frontend** Zod schema. |
| `routes` | string | – | **Deprecated** 2026-04-27. Kept for one release cycle for back-compat; see §8. `maxLength: 500`. |
| `source` | enum | – | Optional analytics tag: `landing` (default) \| `qr_event` \| `referral` \| `other`. |
| `location` | json | – | Optional approximate location of the filler — see §6. |
| `locationConsent` | enum | – | `granted` \| `denied` \| `not_asked` (default `not_asked`). |
| `device` | json | – | Browser/device signature built server-side from request headers — see §7. |
| `gdprConsent` | boolean | ✓ | `true` only if the user ticked the explicit consent checkbox. Submission is rejected when false. Default `false`. |
| `gdprConsentAt` | datetime | ✓ | ISO timestamp of consent (set client-side at the moment the box is ticked; revalidated server-side to be ≤ now and ≥ submit-1h). |
| `gdprConsentVersion` | string | ✓ | Versioned identifier of the consent text shown (e.g. `"2026-04-27"`). `maxLength: 64`. |
| `utm` | json | – | UTM/click parameters captured from the landing URL on first paint — see §9. |

Strapi 5 manages `documentId` and `createdAt`/`updatedAt` automatically — we
do not add custom timestamp columns.

### 3.1 Lifecycle validation (server-side, defensive)

Implemented in `src/api/waitlist-submission/content-types/waitlist-submission/lifecycles.js`,
runs in `beforeCreate` and `beforeUpdate`:

- `whatsapp` (existing): regex `/^(\+|00)[0-9 ]{7,20}$/` if present.
- `gdprConsent` MUST be exactly `true` — else `ValidationError`.
- `gdprConsentAt` MUST parse as a valid ISO datetime, ≤ now, and ≥
  now − 1 hour. Else `ValidationError`.
- `gdprConsentVersion` MUST be a non-empty string ≤ 64 chars.
- `cities` (if present) MUST be an array of 1–10 trimmed non-empty strings,
  each ≤ 120 chars.
- `name` trimmed length 1–200.

The backend deliberately does **not** enforce role-specific min-cities rules
(e.g. "min 2 for senders"). That logic lives on the frontend so the UI can
give targeted messages. The backend stays permissive so a partial-but-mostly-
good submission isn't discarded over a server-side enum mismatch.

---

## 4. Role enum

| Value | RO label (frontend) | Meaning |
|---|---|---|
| `expeditor` | "Trimit pachete" | Sends parcels (typically diaspora → Moldova). |
| `transportator` | "Transport pachete" | Drives / carries parcels for others. |
| `destinatar` | "Primesc pachete" | Receives parcels. The diaspora-vs-Moldova split is derived from `cities`, not the role. |
| `ambele` | — | **Deprecated** 2026-04-27. Frontend stops emitting it on release day; enum value stays legal until §8 step 4 so historical rows remain valid. |

Default value: `expeditor`.

---

## 5. `cities` semantics

`cities` is **always a JSON array of trimmed non-empty strings**. The order
is load-bearing for all three roles:

| Role | Order semantics | Min | Max |
|---|---|---|---|
| `expeditor` | `cities[0]` = origin (sends FROM), `cities[length-1]` = destination. Middle = transit waypoints. | 1 | 10 |
| `destinatar` | Same order as `expeditor`. The role tells us which side of the trip the user is on, not the array. | 1 | 10 |
| `transportator` | `cities[0]` = departure, `cities[length-1]` = end of route. Middle = approximate delivery waypoints in travel order. | 1 | 10 |

The frontend exposes `cities[0]` as "Plecare" and `cities[length-1]` as
"Destinație" for every role; analytics consumes the ordering identically.

---

## 6. `location` field

The location field is **optional** and reflects the user's choice. Three
possible shapes:

```ts
type LocationGranted = {
  source: "geolocation";
  lat: number;
  lon: number;
  accuracyMeters: number;
};

type LocationIp = {
  source: "ip";
  city: string | null;
  country: string | null;     // ISO-3166-1 alpha-2
};

type Location = LocationGranted | LocationIp | null;
```

Resolution priority (frontend, see frontend spec §X):

1. If the user grants the browser geolocation prompt → store
   `{ source: "geolocation", lat, lon, accuracyMeters }`.
2. Else if the user **declines** the prompt or hits "ascunde locația mea" →
   store `null` and `locationConsent: "denied"`.
3. Else (prompt not shown / IP-only fallback opted in) → server-side resolves
   IP → city/country via request headers (`x-forwarded-for` / `cf-ipcountry`
   if behind Cloudflare; otherwise via a lightweight server-side lookup).
   Stored as `{ source: "ip", city, country }`. The browser does NOT send
   IPs in the payload.

**Privacy invariants:**

- The browser never bypasses the geolocation API for precise coordinates.
- The IP fallback is computed by Next.js server code from headers; it is
  not derivable from the payload and is never logged elsewhere.
- The user can always submit with `location: null` — the field is optional.

---

## 7. `device` field

Captured at the Next.js route handler from request headers, **not** the
client payload. Shape:

```ts
interface DeviceSignature {
  userAgent: string;            // raw User-Agent header (truncated to 512 chars)
  platform: string | null;      // e.g. "macOS", "Windows", "Android" — derived
  language: string | null;      // first Accept-Language entry
  viewport: { w: number; h: number } | null; // sent by client (nice-to-have, can lie)
  timezone: string | null;      // sent by client via Intl.DateTimeFormat
  dnt: boolean;                 // Do-Not-Track header present and "1"
}
```

The handler builds `device` from headers and merges in the optional
`viewport` + `timezone` from the client payload before persisting. **No
canvas/audio fingerprinting; no hashed device IDs** — purely the descriptive
fields above. If `dnt === true`, we still store the signature (it is
diagnostic, not advertising) but do not propagate it to any analytics
pipeline.

---

## 8. Migration / deprecation timeline

One-shot deploy with a one-release deprecation window for `routes` and
`ambele`.

| Step | Owner | When |
|---|---|---|
| 1. Add `cities`, add `destinatar` enum value, mark `routes` optional, add `source`, `location`, `locationConsent`, `device`, `gdprConsent`, `gdprConsentAt`, `gdprConsentVersion`, `utm`. | Strapi admin / schema PR | Before frontend release. |
| 2. Frontend v2 ships. Stops writing `routes`. Stops emitting `ambele`. Writes `cities`, `source`, consent trio, `utm`. | Frontend | Release day. |
| 3. Monitor 1 release cycle (~2 weeks). Confirm no new submissions arrive with `routes` populated and `cities` empty. | Backend | T+2 weeks. |
| 4. Export the historical `routes` strings as CSV (admin → bulk export). Then remove `routes` field and remove `ambele` from the role enum. | Backend | T+2 weeks. |

**No automatic backfill** of `routes → cities`. The free-text strings are
too inconsistent to parse safely. The CSV export is the historical record.

---

## 9. UTM capture

The frontend captures these query parameters from the **landing URL on first
paint** (not the form-submit URL — they may have been stripped by client-side
navigation):

`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`,
`gclid`, `fbclid`. It also captures `document.referrer` once.

```ts
interface UtmCapture {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;        // Google Ads click ID
  fbclid?: string;       // Meta click ID
  referrer?: string;     // document.referrer at first paint
}
```

Persistence strategy (frontend):

- On first landing-page mount, write the captured values to
  `sessionStorage["hulubul:utm"]`.
- On form submit, read from sessionStorage and include as `utm` in the
  payload.
- Only non-empty entries are sent. If sessionStorage is empty (or the user
  navigated in directly), `utm` is omitted entirely.

Empty `utm` is stored as `null` in Strapi. Each string is truncated to 256
chars at the route handler before persistence.

---

## 10. Coordination with the survey epic

`design/epic-survey/post-waitlist.md` currently uses
`Role = z.enum(["expeditor", "transportator", "ambele"])`. When the survey
is implemented, its enum must be updated to match this spec
(`expeditor | transportator | destinatar`). The survey backend collections
(`survey-sender`, `survey-transporter`) are separate and are touched at
survey-implementation time, not now.

A one-line cross-reference note will be added to `post-waitlist.md`
pointing here.

---

## 11. API endpoints

### 11.1 Public — Next.js route handler

```
POST /api/waitlist
Content-Type: application/json
Body: WaitlistPayload (see §11.3)

Responses:
  201 { ok: true }                          — created
  400 { error: "<first Zod issue message>" } — Zod validation failed
  429 { error: "Prea multe încercări …" }    — rate limited (see §12)
  502 { error: "<message>" }                — Strapi rejected or unreachable
```

The handler:

1. Applies rate-limit + honeypot checks (see §12). 429 / 400 on failure.
2. Parses JSON body — 400 on invalid JSON.
3. `waitlistSchema.safeParse(json)` — 400 on validation failure, surfacing
   the first issue's message.
4. Builds `device` from request headers + `client` hints.
5. Resolves `location` IP-fallback if `locationConsent === "not_asked"`.
6. `submitWaitlist(parsed.data)` — wraps Strapi POST.
7. Returns 201 on success, 502 with the error message otherwise.

### 11.2 Internal — Strapi

```
POST {STRAPI_URL}/api/waitlist-submissions
Authorization: Bearer {STRAPI_API_TOKEN}
Content-Type: application/json
Body: { data: WaitlistPayload }
```

A 401/403 from Strapi is mapped to a clear server log pointing at the
runbook (`design/strapi-runbook.md` §4 — token permissions). The browser
sees a generic 502.

### 11.3 Payload contract

```ts
// shared between frontend Zod schema and the Strapi `data` envelope
interface WaitlistPayload {
  name: string;          // trimmed, non-empty, ≤ 200
  email: string;         // lowercased + trimmed, valid email
  whatsapp?: string;     // optional; trimmed; absent if blank
  role: "expeditor" | "transportator" | "destinatar";
  cities: string[];      // length 1..10, each trimmed and non-empty, ≤ 120
  source?: "landing" | "qr_event" | "referral" | "other";  // default "landing"

  // Consent (required)
  gdprConsent: true;                  // must be exactly true; payload rejected otherwise
  gdprConsentAt: string;              // ISO timestamp set when the box was ticked
  gdprConsentVersion: string;         // e.g. "2026-04-27"

  // Optional analytics / signature
  location?: Location | null;         // see §6
  locationConsent?: "granted" | "denied" | "not_asked";  // default "not_asked"
  utm?: UtmCapture | null;            // see §9
  // device is server-built. Client may include hints:
  client?: { viewport?: { w: number; h: number }; timezone?: string };

  // Anti-spam
  hp_field?: string;                  // honeypot — must be empty/absent (see §12)
}
```

The route handler:

- defaults `source` to `landing`,
- defaults `locationConsent` to `not_asked`,
- builds the persisted `device` from request headers + `client` hints,
- **rejects with 400** any payload where `gdprConsent !== true`,
- **rejects with 400** any payload where `hp_field` is a non-empty string.

---

## 12. Spam / abuse protection

Defense in depth across three layers:

**Layer 1 — Honeypot (Next.js handler)**

- The frontend renders an `<input name="hp_field">` hidden via CSS
  (`position:absolute; left:-9999px; aria-hidden`).
- Real users never fill it. Bots usually do.
- Any submission with a non-empty `hp_field` is silently rejected (400 with
  a generic message; the bot does not learn it was caught).

**Layer 2 — Rate limit (Next.js handler)**

- Per-IP token bucket: **5 submissions per 10 minutes**, **30 per 24h**.
- IP key derived from `x-forwarded-for` (first value) or
  `cf-connecting-ip`. Falls back to `req.socket.remoteAddress`.
- Implementation: in-memory LRU sufficient for v1 (single Next.js
  instance). Upgrade to a shared store (Upstash / Vercel KV) when we run
  multi-instance.
- Excess returns 429 with body `{ error: "Prea multe încercări. Încearcă din
  nou peste câteva minute." }`.

**Layer 3 — CORS lock-down (Strapi)**

- `config/middlewares.js` replaces the bare `'strapi::cors'` entry with an
  object form that restricts `origin` to the landing-page origins via env
  var `CORS_ALLOWED_ORIGINS` (comma-separated list).
- Default in dev: `http://localhost:3000`.
- Default in prod: `https://hulubul.com,https://www.hulubul.com` (or the
  staging equivalent), set in Strapi Cloud env.
- Methods restricted to `GET,POST,OPTIONS`. Credentials disabled.

**Out of scope for v1:** CAPTCHA, IP-reputation lookups, distributed rate
limiting. Add only if abuse appears in the wild.

---

## 13. Strapi admin steps (for the backend operator)

Run on Strapi Cloud (`design/strapi-runbook.md` §3):

1. **Content-Type Builder → Waitlist submission**
   - Add `cities` (JSON, optional). Description: *"Ordered city array. For
     all roles: index 0 = origin (departure), last = destination (arrival).
     Middle indices = waypoints in travel order."*
   - Add `source` (enum: `landing`, `qr_event`, `referral`, `other`).
     Default `landing`.
   - Add `location` (JSON, optional). Description: *"Approximate filler
     location. See spec §6."*
   - Add `locationConsent` (enum: `granted`, `denied`, `not_asked`).
     Default `not_asked`.
   - Add `device` (JSON, optional). Description: *"Browser/device
     descriptive signature. See spec §7."*
   - Add `gdprConsent` (boolean, **required**). Default false.
   - Add `gdprConsentAt` (datetime, **required**).
   - Add `gdprConsentVersion` (string, **required**, max 64).
   - Add `utm` (JSON, optional). Description: *"Captured UTM/click
     parameters. See spec §9."*
   - Edit `role` enum: add `destinatar`. Keep `ambele` for now (deprecated,
     removed in step 4 of §8).
   - Edit `routes`: required = false, maxLength 500. Description:
     *"Deprecated 2026-04-27 — see spec §8."*
   - Edit `name`: maxLength 200.
   - Save & publish.
2. **Settings → API Tokens → STRAPI_API_TOKEN**
   - Verify `create` on `waitlist-submission`. Token permissions are
     per-collection; existing tokens cover the new fields automatically.
3. **Settings → Roles → Public**
   - Confirm: `find` and `create` on `waitlist-submission` remain **off**.
4. **Smoke test** — POST a sample payload through `/api/waitlist` from a
   staging build; confirm a row appears with `cities` populated, consent
   trio set, and `routes` null.

---

## 14. Error model

| Cause | Status from Next | Body | Frontend behaviour |
|---|---|---|---|
| Honeypot tripped | 400 | `{ error: "Invalid request" }` | No special UX (bots only). |
| Rate limit exceeded | 429 | `{ error: "Prea multe încercări …" }` | Toast + disable submit for 60s. |
| Malformed JSON body | 400 | `{ error: "Invalid JSON body" }` | Inline error in the form. |
| `gdprConsent !== true` | 400 | `{ error: "Trebuie să accepți politica de confidențialitate." }` | Inline error on the consent checkbox. |
| Zod validation fails | 400 | `{ error: "<first Zod issue>" }` | Inline error referencing the field. |
| Strapi 401/403 | 502 | `{ error: "Strapi refused …" }` | Generic toast; server log carries runbook pointer. |
| Strapi 4xx other than auth | 502 | `{ error: "Strapi /api/waitlist-submissions failed: <code>" }` | Generic toast. |
| Network/Strapi unreachable | 502 | `{ error: "<fetch error message>" }` | Generic toast. |
| Success | 201 | `{ ok: true }` | Form shows success state with survey CTA. |

The Next handler **never** leaks Strapi raw response bodies to the browser.

---

## 15. Privacy & retention

| Field | Sensitivity | Notes |
|---|---|---|
| `name`, `email`, `whatsapp` | PII | Subject of GDPR consent. |
| `role`, `cities`, `source` | Behavioural | Not PII on its own. |
| `location` (geolocation) | Sensitive — precise coords | Only stored if `locationConsent === "granted"`. |
| `location` (ip) | Coarse — city-level | Stored when consent is `not_asked` and the user did not opt out. |
| `device` | Diagnostic | UA + headers; no fingerprint hash. |
| `utm` | Marketing attribution | Truncated at 256 chars per field. |
| `gdprConsent*` | Legal record | Immutable after write. |

Operating rules:

- The CMS `privacyNote` next to the submit button is the user-facing
  framing; the legal record is the `gdprConsent` trio.
- `gdprConsentVersion` is bumped whenever the privacy note changes
  materially. Old submissions keep their old version string — never rewritten.
- Retention: until launch + 12 months. Submissions whose `email` has not
  become a logged-in user are exported and deleted. Future ops procedure;
  not enforced by Strapi today.
- Subject Access / Delete: handled manually via Strapi admin until a
  SAR/DSR flow exists.
- `dnt: true` submissions: still stored but excluded from any third-party
  analytics export.

---

## 16. Acceptance criteria

- [ ] Strapi `waitlist-submission` has `cities` (JSON, optional), `source`
      (enum, default `landing`), `location` (JSON, optional),
      `locationConsent` (enum, default `not_asked`), `device` (JSON,
      optional), `gdprConsent` (boolean, required), `gdprConsentAt`
      (datetime, required), `gdprConsentVersion` (string, required), `utm`
      (JSON, optional). Role enum includes `destinatar`.
- [ ] `routes` is marked optional and described as deprecated.
- [ ] Lifecycle validation rejects submissions without `gdprConsent: true`,
      with stale `gdprConsentAt`, or with malformed `cities`.
- [ ] CORS middleware restricts origins to the configured allowlist.
- [ ] Next.js handler enforces honeypot + per-IP rate limit (5/10min).
- [ ] `STRAPI_API_TOKEN` has `create` on `waitlist-submission`.
- [ ] Public role has neither `find` nor `create`.
- [ ] POST through `/api/waitlist` with the new payload returns 201 and
      creates a row with `cities` populated, `routes` null, `source = landing`.
- [ ] POST with old shape (`routes` only) succeeds at the **Strapi** layer
      during the deprecation window, but the **Next.js route handler**
      rejects it with 400 because frontend Zod requires `cities`.
- [ ] Existing rows are unchanged; admin UI displays them without errors.
- [ ] Schema test (`tests/schemas/waitlist-submission.test.js`) updated to
      assert all new fields and new enum values.
- [ ] Lifecycle test asserts consent + cities validation paths.
- [ ] After T+2 weeks: `routes` removed; `ambele` removed from enum;
      historical CSV archived.

---

## 17. Out of scope

- Migrating historical free-text `routes` to structured `cities`.
- Per-field token permissions (Strapi token model is per-collection).
- Server-side geocoding of submitted cities (canonical lat/lon lives in
  the routes domain).
- A "secondary role" field for people who genuinely both send and transport.
- Linking waitlist submissions to the `route` collection.
- Webhooks / lifecycle hooks for hot-lead alerting.
- Subject Access / Delete request UI.
- Email uniqueness — duplicates are explicitly allowed; resolution happens
  downstream.
- Sanitized response body (full record echoed back is acceptable).

---

## 18. Risks

| Risk | Mitigation |
|---|---|
| Strapi enum change breaks rows with `ambele`. | Value remains legal until §8 step 4. |
| `cities: json` is awkward to filter in the Strapi admin. | Acceptable — admin only reads. Filtering lives in downstream analytics. |
| Frontend posts an old shape after a partial deploy. | `routes` and `cities` are both optional at the Strapi layer; either shape lands. The Next handler enforces the new shape. |
| Token rotation forgets the new fields. | Token permissions are per-collection, not per-field — rotation is unaffected. |
| Public role accidentally re-enabled. | Acceptance criterion §16 explicitly checks; runbook documents recovery. |
| In-memory rate limiter resets on Next.js redeploy. | Acceptable for v1 (single-instance, low-traffic). Upgrade path documented in §12. |
| GDPR consent text drifts from `gdprConsentVersion`. | Version string lives in a single CMS field; bump-on-change is part of the privacy-update checklist. |

---

## 19. Change notes

### 2026-04-27 — v2 (this revision)

Replaces the earlier short spec ("split `contact` → `email` + `whatsapp`,
make `routes` mandatory") with the full backend contract above.

**Added fields:**

- `cities` (JSON, optional) — structured replacement for `routes`.
- `source` (enum, default `landing`).
- `location` (JSON, optional) + `locationConsent` (enum).
- `device` (JSON, server-built).
- `gdprConsent` (boolean, required) + `gdprConsentAt` (datetime, required)
  + `gdprConsentVersion` (string, required).
- `utm` (JSON, optional).

**Schema changes:**

- `name`: added `maxLength: 200`.
- `routes`: now optional (was required), deprecated, `maxLength: 500`.
- `role` enum: added `destinatar`. `ambele` retained as legal value but
  deprecated; frontend stops emitting on release day.
- Email is **explicitly not unique**; duplicates allowed.

**New backend behaviour:**

- Lifecycle hooks now also validate `gdprConsent`, `gdprConsentAt`,
  `gdprConsentVersion`, and `cities` shape.
- CORS hardened via `config/middlewares.js` env-driven allowlist.
- Next.js `/api/waitlist` route handler gains honeypot + per-IP rate limit.

**Removed from scope (vs. brainstorm options):**

- Email uniqueness (`unique: true`) — explicitly rejected by the team.
- Sanitized `{ ok: true }`-only response — default Strapi response is fine.

**Migration:**

- One-shot deploy; one-release deprecation window for `routes` and
  `ambele` (see §8). No automatic backfill of free-text routes.

**Companion docs introduced:**

- `design/spec-waitlist-frontend.md` — the frontend Zod schema, form UX,
  consent UI, UTM/location capture.
