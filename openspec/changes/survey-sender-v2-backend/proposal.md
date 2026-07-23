# EPIC: Survey Sender v2 — new Strapi content type

## Appetite

Small — one new collection-type mirroring an existing one, no migrations of live data,
no changes to any running collection.

## Why

Product replaced the sender questionnaire with a shorter v2 on the frontend
(`hulubul-front`, epic `sender-questionnaire-v2`, already built and deployed). The v2 form
posts to `${STRAPI}/api/survey-sender-v2s`, which 404s today because the collection doesn't
exist — every v2 submission currently fails with a 502. This is the backend half of that
hand-off, specified in `hulubul-front/design/spec-survey-sender-v2-backend.md`.

## Solution outline

Add a new, standalone Strapi collection-type `survey-sender-v2` that mirrors the existing
`survey-sender` collection's shape (core factory controller/route/service, `draftAndPublish:
false`, no public role permissions — Bearer API-token only). It carries v2's own field set and
enums (structured 2-city route, capped multi-selects, a merged channel/switch-reasons question,
an Alpha-testing opt-in). It does not touch `survey-sender` at all — the two collections are
siblings, not a migration.

## Key decisions

- **DEC-1**: New sibling collection-type, not an extension of `survey-sender` — the question
  sets and enums diverge enough (structured route, capped multi-select caps, merged
  channel/switch question) that coupling them would make both harder to evolve independently.
  Matches the frontend spec's explicit framing.
- **DEC-2**: No lifecycle validation hooks for `testPhone`/`testConsent` (no format check, no
  conditional-required gating), unlike `survey-sender`'s `whatsapp`/`callbackPhone` phone-format
  validation. The hand-off spec is explicit these are frontend-Zod-only for now; adding
  server-side enforcement would be scope creep beyond what was asked.
- **DEC-3**: API-token permission grant (`create` on `survey-sender-v2` for the shared
  `STRAPI_API_TOKEN`) is a manual Admin-UI step, documented in `docs/DEPLOY-RUNBOOK.md` — same
  pattern already used for `survey-sender` and `waitlist-submission`. Strapi API tokens aren't
  content-store rows, so bootstrap code can't grant them; only the users-permissions roles are
  bootstrap-automatable, and this collection deliberately gets none of those (no public, no
  authenticated-role access).

## Rabbit-holes

- Strapi's default pluralizer for `survey-sender-v2` needs to actually resolve to
  `survey-sender-v2s` (what the frontend already assumes) — verify after scaffolding rather than
  assuming.
- `json` array fields (`howFindTransporter`, `difficulties`, `decisionCriteria`,
  `trustSignals`, `switchReasons`) carry cardinality rules (min 1, some capped at max 3) that
  Strapi's schema can't express structurally — these stay documentation/test-level constraints,
  not schema constraints, matching how `survey-sender`'s existing `json` fields work.
- Strapi's `enumeration` type unconditionally rejects any value that doesn't have a letter
  before its first digit (GraphQL enum-naming rule in `@strapi/core`, not configurable) —
  `searchDuration`'s canonical values (`5_15_min`, `15_30_min`, `30_60_min`) trip this. Resolved
  as DEC-4 in design.md: `searchDuration` is a `string`, not an `enumeration`. Caught by
  actually booting Strapi during verification, not by reading the spec alone.

## No-gos

- No changes to the existing `survey-sender` collection, its schema, its data, or its
  lifecycle hooks.
- No frontend changes — the frontend is already built and deployed; this repo is backend-only
  per this project's CLAUDE.md.
- No server-side enforcement of `testPhone`/`testConsent` conditional-required gating or phone
  format — frontend Zod is the only gate, as the hand-off spec directs.
- No gazetteer/geocoding validation of `routeCities` — free text, client-autocomplete-assisted
  only.
- No automated grant of the API token's `create` permission — Strapi API tokens are managed in
  Admin UI, not content-store data; this stays a documented manual runbook step.

---

## What Changes

- New Strapi collection-type `survey-sender-v2` (`src/api/survey-sender-v2/`): schema, core
  controller/route/service factories.
- New schema tests (`tests/schemas/survey-sender-v2.test.js`) asserting every attribute, type,
  required flag, and enum against the hand-off spec.
- `docs/DEPLOY-RUNBOOK.md`: new checklist entry for granting the API token `create` on
  `survey-sender-v2`, mirroring the existing `waitlist-submission` entry.

## Capabilities

### New Capabilities
- `survey-sender-v2`: the v2 sender-survey backend collection — schema, access rules, and the
  deploy-time permission step that makes the frontend's `/api/survey-v2` path succeed.

### Modified Capabilities
None — `survey-sender` has no existing `openspec/specs/` entry and isn't being changed.

## Impact

- **Code**: new directory `src/api/survey-sender-v2/` (schema.json, controllers, routes,
  services); new test file `tests/schemas/survey-sender-v2.test.js`.
- **Docs**: `docs/DEPLOY-RUNBOOK.md` gains a permission-grant checklist item.
- **Deploy**: the `STRAPI_API_TOKEN` used by the frontend must be granted `create` on
  `survey-sender-v2` in Admin → Settings → API Tokens before the frontend deploy that flips
  `/sondaj/expeditori` to v2 can succeed end-to-end (same deploy-order constraint already
  documented for `waitlist-submission`).
- **No database migration needed**: this is a new table, not an alteration of an existing one.
