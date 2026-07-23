> Derived from EPIC survey-sender-v2-permissive-choice-limits

## 1. Regression test

- [x] 1.1 Add a test case to `tests/schemas/survey-sender-v2.test.js` for each capped
      multi-select field (`difficulties`, `decisionCriteria`, `trustSignals`, `switchReasons`)
      asserting the `json` attribute carries no `maxItems`/length-limiting property — proves the
      schema structurally cannot reject an over-cap selection.
- [x] 1.2 Add one explicit "accepts more than the frontend cap" assertion (e.g. build a
      5-entry `difficulties` array and confirm it round-trips through the schema's attribute
      definition unconstrained) — satisfies the new scenario in
      `specs/survey-sender-v2/spec.md`.

## 2. Verify

- [x] 2.1 Run `npm test` — full suite green, including the new assertions.
- [x] 2.2 `openspec validate --strict` passes for this change.
- [x] 2.3 Confirm `src/api/survey-sender-v2/` still has no lifecycle file (i.e. no max-count
      enforcement was accidentally introduced) — a `find`/`ls` check, not a code change.

## Roadmap

- [x] 1.1 · [x] 1.2 · [x] 2.1 · [x] 2.2 · [x] 2.3

## Verification

`npm test` (schema tests) + `openspec validate --strict`; task 2.3 double-checks no lifecycle
hook was introduced that would silently violate the "no max enforced" policy.
