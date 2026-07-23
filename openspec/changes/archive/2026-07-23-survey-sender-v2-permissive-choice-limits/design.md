> Parent: EPIC survey-sender-v2-permissive-choice-limits (`proposal.md`)

## Context

`survey-sender-v2` (`src/api/survey-sender-v2/`, shipped in change `survey-sender-v2-backend`)
stores its five multi-select questions as `json` array attributes with no lifecycle hooks —
Strapi's schema format has no way to express "array, min 1, max 3" structurally, so that change
deliberately left cardinality undocumented-in-schema and untested for the upper bound. This
change closes that gap on the "no upper bound" side only, per explicit product direction: the
backend must stay permissive; any cap belongs to the frontend's Zod schema (`lib/survey-schema-v2.ts`
in `hulubul-front`), which can change independently of a backend deploy.

## Goals / Non-Goals

**Goals:**
- State explicitly, in the durable spec, that no multi-select field has a server-side maximum.
- Add a regression test that fails if anyone later adds a `beforeCreate`/`beforeUpdate` length
  check to `survey-sender-v2`'s lifecycle.

**Non-Goals:**
- Enforcing (or even asserting) a *minimum* selection count — out of scope, unchanged from
  `survey-sender-v2-backend`.
- Touching `routeCities` (a fixed 2-element pair, not a variable-cardinality multi-choice
  question).
- Any frontend change.

## Decisions

Settled in the EPIC (DEC-1, DEC-2). No new technical decisions — this is a spec + test change
only; `src/api/survey-sender-v2/` has no lifecycle file today and none is being added.

## Algorithm / approach

No runtime code changes. The "approach" is entirely test + spec:

1. Extend `tests/schemas/survey-sender-v2.test.js` (or add a small sibling behavior test) with a
   case that builds a `difficulties` array longer than the frontend's documented cap (5 entries,
   cap is 3) and asserts the schema itself imposes no `maxItems`-equivalent constraint — i.e.
   the `json` type attribute has no length-limiting property, so Strapi's schema-level validation
   cannot reject it. This is a schema-shape assertion (mirrors the existing test file's style),
   not a live-database integration test — consistent with how the rest of this test file already
   verifies schema shape rather than booting Strapi per test.
2. No `schema.json` change: the fields are already plain `json` with no size constraint.

Idempotency: not applicable — no write path changes.

### Anti-patterns

- ❌ Don't add a `beforeCreate` length check "just to be safe" — that is precisely what this
  change forbids (DEC-1).
- ❌ Don't try to express "max 3" as a schema-level constraint Strapi doesn't support (e.g. via a
  custom validator) "for documentation" — the requirement is silence, not a differently-shaped
  enforcement.

## Error matrix

| Failure mode | Expected handling |
|---|---|
| Payload selects more options than the frontend's own cap | Accepted — no backend enforcement (DEC-1); frontend Zod is the only gate that would have stopped this payload from being sent |
| Payload omits a multi-select field entirely | Still rejected — `required: true` is unchanged; this change only touches the upper bound, not required-ness |

## Risks / Trade-offs

- **[Risk]** A future change could silently reintroduce a max-count lifecycle check without
  anyone noticing it violates this policy. **Mitigation**: the regression test added here fails
  loudly if that happens.
- **[Risk]** None on the data-integrity side — being permissive on an upper bound can't corrupt
  data, only store more selections than expected, which is harmless for a survey response.

## Open Questions

None.
