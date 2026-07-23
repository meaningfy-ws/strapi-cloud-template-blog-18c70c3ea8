> Parent: EPIC survey-sender-v2-backend (`proposal.md`)

## Context

The frontend (`hulubul-front`) already ships `SurveyFormV2` posting to
`${STRAPI}/api/survey-sender-v2s`. The collection doesn't exist in this backend yet, so every
submission 404s → the frontend's route handler maps that to a 502. The field/enum contract is
fully specified in `hulubul-front/design/spec-survey-sender-v2-backend.md` (canonical source —
mirrors `hulubul-front/lib/survey-schema-v2.ts` exactly). This backend repo already has an
identical-shaped precedent: `src/api/survey-sender/` (collection-type, core factories, Bearer-
token-only writes, no lifecycle-enforced conditional-required fields beyond phone-format
checks). `survey-sender-v2` should look structurally identical to that precedent, with its own
field set.

## Goals / Non-Goals

**Goals:**
- Ship a `survey-sender-v2` collection-type whose schema matches the hand-off spec
  field-for-field, enum-for-enum.
- Keep write access restricted to the shared Bearer API token (no public/authenticated-role
  grant), consistent with `survey-sender`.
- Cover the schema with the same BDD-style test pattern already used for
  `waitlist-submission`/`route`/`transporter`.
- Document the one manual step (Admin API-token permission grant) the deploy runbook needs.

**Non-Goals:**
- No lifecycle hooks (`beforeCreate`/`beforeUpdate`) for this collection — see DEC-2 in the EPIC.
- No change to `survey-sender`'s schema, controllers, lifecycles, or data.
- No frontend work.
- No database migration script — this is a brand-new table (Strapi auto-creates it from the
  schema on next boot); nothing existing is being altered or backfilled.

## Decisions

Everything of substance was already settled in the EPIC (DEC-1..DEC-3 — sibling collection,
no server-side phone/gating validation, manual token-permission grant). Two implementation-level
additions, one of them discovered mid-build:

- **Plural API id**: rely on Strapi's default pluralizer rather than hand-setting
  `info.pluralName`. `survey-sender-v2` → default pluralizer appends `s` → `survey-sender-v2s`,
  which is exactly what the frontend's `lib/survey-v2.ts` already assumes. Verified by asserting
  `schema.info.pluralName === 'survey-sender-v2s'` in the schema test rather than trusting the
  pluralizer blindly (rabbit-hole flagged in the EPIC).
- **DEC-4 (discovered during boot verification)**: `searchDuration` is a plain `string`
  attribute, NOT a Strapi `enumeration`. Strapi's content-type validator
  (`@strapi/core/dist/domain/content-type/validator.js`) unconditionally rejects enumeration
  values that don't have a letter before their first digit — a GraphQL enum-naming rule baked
  into core content-type registration, independent of whether the GraphQL plugin is installed.
  Three of the hand-off spec's canonical values (`5_15_min`, `15_30_min`, `30_60_min`) violate
  this; Strapi refused to boot with the error `Invalid enumeration value. Values should have at
  least one alphabetical character preceding the first occurence of a number.` Renaming the
  values was not an option — the "No frontend changes" no-go plus the spec's own
  character-for-character requirement rule that out. Falling back to `string` keeps the exact
  literal contract intact and mirrors how the JSON multi-select fields (`difficulties` etc.)
  already have their value sets documented-but-not-schema-enforced, rather than inventing a new
  enforcement mechanism for one field. `sendingFrequency` and `wantsToTest` are unaffected (no
  value starts with a digit) and stay `enumeration`.

## Algorithm / approach

Structural mirror of `src/api/survey-sender/`:

```
src/api/survey-sender-v2/
├── content-types/survey-sender-v2/schema.json   # the 19 attributes from the hand-off spec
├── controllers/survey-sender-v2.js              # createCoreController (factory, no overrides)
├── routes/survey-sender-v2.js                   # createCoreRouter (factory, no overrides)
└── services/survey-sender-v2.js                 # createCoreService (factory, no overrides)
```

Schema attribute mapping (spec → Strapi type), everything not marked required stays optional
with no default:

| Field | Strapi type | Required |
|---|---|---|
| `name` | `string`, maxLength 200 | yes |
| `email` | `email` | yes |
| `routeCities` | `json` | yes |
| `sendingFrequency` | `enumeration` (5 values) | yes |
| `howFindTransporter` | `json` | yes |
| `howFindTransporterOther` | `text` | no |
| `searchDuration` | `string` (7 canonical values, documented not enforced — DEC-4) | yes |
| `difficulties` | `json` | yes |
| `difficultiesOther` | `text` | no |
| `decisionCriteria` | `json` | yes |
| `decisionCriteriaOther` | `text` | no |
| `trustSignals` | `json` | yes |
| `trustSignalsOther` | `text` | no |
| `switchReasons` | `json` | yes |
| `switchReasonsOther` | `text` | no |
| `mostImportantThing` | `text` | yes |
| `wantsToTest` | `enumeration` (3 values) | yes |
| `testPhone` | `string` | no |
| `testConsent` | `boolean` | no |

`kind: collectionType`, `options.draftAndPublish: false`, no relations (unlike `survey-sender`,
this collection has no `consentRecord` relation — the hand-off spec doesn't mention one, and
adding one would be scope creep beyond the spec).

Idempotency: `POST /api/survey-sender-v2s` is a plain create with no dedupe/upsert key (matches
`survey-sender`'s own behavior — the hand-off spec doesn't ask for dedupe). Retried/duplicate
frontend submissions create duplicate rows; that's the existing v1 behavior too, not a
regression introduced here.

### Anti-patterns

- ❌ Don't add a relation to `consent-record` "for consistency with `waitlist-submission`" — not
  in the spec; would be inventing scope.
- ❌ Don't hand-set `pluralName` defensively "just in case" — test the default instead (see
  Decisions above); a hand-set value that silently drifts from Strapi's actual default is worse
  than trusting and verifying the default.
- ❌ Don't reach for `WAITLIST_SERVER_ACTIONS`-style `permissions.js` + bootstrap auto-grant —
  that pattern exists for the *Authenticated* users-permissions role; this collection
  deliberately has no such grant (Bearer API token only, granted manually). Adding a
  permissions.js here would document a grant path that isn't actually used.

## Error matrix

| Failure mode | Expected handling |
|---|---|
| Request has no Bearer token | Strapi's default RBAC returns `403` (no public-role permission exists) |
| Bearer token exists but lacks `create` on this collection | Strapi returns `403` — resolved by the manual Admin grant documented in the runbook, not by app code |
| Payload missing a required field (`name`, `email`, `routeCities`, `mostImportantThing`, any required enum) | Strapi's schema-level validation returns `400` |
| Enum value outside the canonical set (`sendingFrequency`, `wantsToTest`) | Strapi's schema-level validation returns `400` |
| Out-of-contract value for `searchDuration` | Accepted — not schema-enforced (DEC-4); the frontend's Zod schema is the only gate |
| `testPhone`/`testConsent` malformed or missing despite `wantsToTest !== "nu"` | Strapi accepts it (no server-side gating, by design — DEC-2) |
| Strapi's actual default pluralizer output differs from `survey-sender-v2s` | Caught immediately by the schema test's `pluralName` assertion, before this ships; if it happens, the frontend's `lib/survey-v2.ts` path constant needs a one-line update (frontend repo, out of scope here) |

## Risks / Trade-offs

- **[Risk]** Pluralizer mismatch breaks the frontend integration silently until someone hits the
  form. **Mitigation**: schema test asserts `pluralName` explicitly (see Decisions); CI catches
  it before merge.
- **[Risk]** Forgetting the manual Admin API-token grant blocks every submission post-deploy,
  same failure class as the `waitlist-submission` incident this runbook entry already guards
  against. **Mitigation**: `docs/DEPLOY-RUNBOOK.md` gets the same checklist treatment, and the
  proposal's Impact section calls out the deploy-order constraint.

## Open Questions

None — the hand-off spec is unambiguous and the existing `survey-sender` collection is a direct
structural precedent for everything not explicitly specified.
