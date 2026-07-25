> Parent: `proposal.md` (EPIC: Add `location` field to survey-sender-v2), DEC-1..DEC-3

## Context

`survey-sender-v2` (change `survey-sender-v2-backend`, archived 2026-07-23) is a Strapi
collection-type with `draftAndPublish: false` and zero lifecycle hooks. The frontend
(`hulubul-front`) is adding silent, best-effort location capture to its `SurveyFormV2` and needs
a place to persist the resolved value. `waitlist-submission` already solves the identical problem
with a `location` JSON attribute (`{type: "json", required: false}`) plus a separate
`locationConsent` enum — but that consent field exists only because the waitlist form shows a
visible consent UI; `survey-sender-v2`'s capture is silent, so there's no consent state to record.

## Goals / Non-Goals

**Goals:**
- Persist whatever location value the frontend sends, without dropping or rejecting valid
  payloads that omit it.
- Reuse the existing `Location` shape verbatim (no new discriminated-union variant, no schema
  drift between collections).

**Non-Goals:**
- Server-side validation of the `location.source` union shape — Strapi's JSON field type accepts
  any JSON; this collection has no lifecycle hooks and this change adds none (see EPIC
  rabbit-hole).
- Any consent tracking (DEC-2).

## Decisions

All decisions already settled in the EPIC (DEC-1, DEC-2, DEC-3) — nothing new to add here beyond
citing them. This is a one-attribute schema addition; no algorithmic complexity.

## Algorithm / approach

Single change: add `location` to the `attributes` map in
`src/api/survey-sender-v2/content-types/survey-sender-v2/schema.json`:

```json
"location": {
  "type": "json",
  "required": false
}
```

No migration needed — existing rows simply have no `location` key, which Strapi's JSON field
treats as absent/`null`, identical to how `waitlist-submission` rows created before its own
`location` field existed behave today.

Idempotency: creation is a plain `POST` handled by Strapi's default core controller (no custom
controller logic exists for `survey-sender-v2`); each request creates one new row regardless of
`location`'s presence, same as every other optional field on this collection already.

### Anti-patterns

- ❌ Adding a `beforeCreate`/`beforeUpdate` lifecycle hook to validate `location`'s shape — this
  collection is deliberately hook-free (see `survey-sender-v2-permissive-choice-limits`); don't
  introduce the pattern for one field.
- ❌ Adding `locationConsent` "for symmetry" with `waitlist-submission` — no consent UI exists on
  this form to justify it (DEC-2).

## Error matrix

| Failure mode | Expected handling |
|---|---|
| Payload omits `location` entirely | `201`, row created with no `location` value (unchanged from current behavior) |
| Payload sends `location: null` | `201`, row created with `location` stored as `null` |
| Payload sends a well-formed `location` object (either union variant) | `201`, value persisted unmodified |
| Payload sends a malformed/unexpected JSON shape for `location` | `201` — Strapi's JSON type accepts any valid JSON; no schema-level shape enforcement, consistent with every other JSON field on this collection (`routeCities`, `difficulties`, etc.) |

## Risks / Trade-offs

- [Risk] No server-side shape enforcement means a buggy frontend could write garbage into
  `location`. → Mitigation: same trust boundary already accepted for `routeCities`,
  `howFindTransporter`, etc. on this collection; consistent, not a new risk class.

## Open Questions

None — the hand-off spec (`hulubul-front/design/spec-survey-sender-v2-location-backend.md`)
already resolves shape, scope, and acceptance criteria.
