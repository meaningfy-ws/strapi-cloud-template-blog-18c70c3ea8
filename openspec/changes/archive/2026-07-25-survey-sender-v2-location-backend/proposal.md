# EPIC: Add `location` field to survey-sender-v2

## Appetite

Tiny — one additive JSON attribute on an already-shipped collection, no lifecycle logic, no
permission change.

## Why

`/sondaj/expeditori` (SurveyFormV2, frontend) is gaining silent, best-effort location capture —
the same mechanism the landing waitlist form already uses. The frontend side is implemented and
tested; `survey-sender-v2` has no field to hold the value, so submissions would silently drop it
once the frontend starts sending it.

## Solution outline

Add one optional `location` JSON attribute to the `survey-sender-v2` content-type, reusing
`waitlist-submission.location`'s exact shape (`{type: "json", required: false}`) rather than
inventing a new one. No lifecycle hook, no validation beyond Strapi's default JSON handling —
the discriminated union (`{source: "geolocation", lat, lon, accuracyMeters}` vs
`{source: "ip", city, country}` vs `null`) is a contract-level shape, not schema-enforced, exactly
like the existing multi-select enum contracts on this same collection.

## Key decisions

- **DEC-1**: `location` is `{type: "json", required: false}`, matching `waitlist-submission.location`
  verbatim. Rationale: one canonical shape for "resolved location" across collections; no reason to
  diverge.
- **DEC-2**: No `locationConsent` field. Rationale: the frontend request is silent (no prompt UI,
  no checkbox) — the only two outcomes are "browser gave coordinates" or "it didn't, so IP/nothing
  was used," and `location.source` already carries that distinction. A separate consent enum would
  just restate `location === null` in a second field. If a future revision adds a visible consent
  UI to this form, add `locationConsent` then, matching `waitlist-submission`'s shape — not before.
- **DEC-3**: No permission change. `STRAPI_API_TOKEN` already has `create` on `survey-sender-v2`
  (granted by change `survey-sender-v2-backend`); a new field on an already-permitted collection
  needs no additional grant.

## Rabbit-holes

- Don't add a lifecycle hook to validate the `location` union shape server-side — this collection
  has zero lifecycle hooks by design (see change `survey-sender-v2-permissive-choice-limits`), and
  `waitlist-submission` doesn't validate its own `location` shape server-side either.

## No-gos

- No `locationConsent` field (see DEC-2).
- No change to `survey-sender` (v1) or `waitlist-submission` — this touches only
  `survey-sender-v2`.
- No backfill for existing `survey-sender-v2` rows submitted before this field existed.
- No frontend changes (already implemented in `hulubul-front`, out of this repo's scope).

---

## What Changes

- Add `location` (`json`, optional) to `src/api/survey-sender-v2/content-types/survey-sender-v2/schema.json`.
- Add schema regression tests to `tests/schemas/survey-sender-v2.test.js` covering the new
  attribute and its optionality.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `survey-sender-v2`: gains an optional `location` attribute for approximate submitter location.

## Impact

- **Code**: `src/api/survey-sender-v2/content-types/survey-sender-v2/schema.json`,
  `tests/schemas/survey-sender-v2.test.js`.
- **Docs**: `openspec/specs/survey-sender-v2/spec.md` gains a `location` requirement once this
  change is archived/synced.
- **Frontend**: none — already implemented in `hulubul-front`
  (`design/spec-survey-sender-v2-location-backend.md`), waiting on this field to exist.
