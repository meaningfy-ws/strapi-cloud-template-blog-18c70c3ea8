# EPIC: Permissive multi-choice validation on survey-sender-v2

## Appetite

Tiny — a policy clarification + a regression test locking it in. No new fields, no schema
change beyond what already shipped.

## Why

`survey-sender-v2` (change `survey-sender-v2-backend`) has five multi-select fields
(`howFindTransporter`, `difficulties`, `decisionCriteria`, `trustSignals`, `switchReasons`), four
of which the hand-off spec caps at "max 3" on the frontend. That change's `design.md` already
noted these caps "stay documentation/test-level constraints, not schema constraints" — but never
stated the inverse explicitly: the backend must not *add* enforcement of that cap later either.
Product wants that made an explicit, durable policy: the backend accepts however many options are
ticked; only the frontend enforces a limit, if any. This closes the gap before someone
"helpfully" adds a `beforeCreate` length check.

## Solution outline

Amend the `survey-sender-v2` capability's multi-select requirement to state explicitly that the
backend SHALL NOT enforce a maximum selection count on any multi-select field, and add a
regression test asserting a payload can carry more entries than the frontend's documented cap
without being rejected. No production code changes — `survey-sender-v2` already has zero
lifecycle hooks; this locks that absence in as policy, not incidental.

## Key decisions

- **DEC-1**: Backend enforces no upper bound on any multi-select array field
  (`howFindTransporter`, `difficulties`, `decisionCriteria`, `trustSignals`, `switchReasons`).
  The frontend Zod schema owns any cap. Rationale: caps are a UX/product decision that changes
  more often than the backend should redeploy for, and a backend-side mismatch with the
  frontend's cap would silently 400 valid-per-frontend submissions.
- **DEC-2**: The existing min-1 ("at least one option") expectation from the hand-off spec is
  **not** touched by this change — it was never enforced server-side either (JSON type, no
  lifecycle hook), and this EPIC doesn't add it. Out of scope, not silently implied in.

## Rabbit-holes

- Don't conflate "no max" with "no validation at all" — required-ness (`howFindTransporter` etc.
  are `required: true` JSON fields) still means `null`/missing is rejected by Strapi; only the
  *array length ceiling* is what's being declared permissive here.

## No-gos

- No change to required-ness of any field.
- No change to `routeCities` (exactly-2 constraint) — that's a fixed pair, not a "how many did
  you tick" multi-choice question; out of scope.
- No frontend changes.
- No lifecycle hook added to enforce anything — the point of this change is the opposite.

---

## What Changes

- `openspec/specs/survey-sender-v2/spec.md` (via this change's delta): the multi-select
  requirement gains an explicit "no maximum enforced server-side" scenario.
- New regression test case(s) in `tests/schemas/survey-sender-v2.test.js` (or a small new
  behavior test) proving a payload with more selections than the frontend's cap is accepted at
  the schema level.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `survey-sender-v2`: clarifies that multi-select fields have no server-side maximum-selection
  enforcement.

## Impact

- **Code**: no schema/production code change expected (already permissive by construction);
  possible small addition to the existing schema test file.
- **Docs**: `openspec/specs/survey-sender-v2/spec.md` gains an explicit requirement once this
  change (and its parent `survey-sender-v2-backend`) are archived/synced.
