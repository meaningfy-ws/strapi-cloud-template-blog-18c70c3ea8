> Derived from EPIC survey-sender-v2-backend

## 1. Schema

- [x] 1.1 Write the failing schema test `tests/schemas/survey-sender-v2.test.js` (BDD-style,
      mirroring `tests/schemas/waitlist-submission.test.js`): collection metadata
      (`collectionType`, `draftAndPublish: false`, `pluralName === 'survey-sender-v2s'`) and every
      attribute from the spec table (type, required, enum values, maxLength) — satisfies every
      requirement in `specs/survey-sender-v2/spec.md` except the access-control ones.
- [x] 1.2 Create `src/api/survey-sender-v2/content-types/survey-sender-v2/schema.json` per
      design.md's attribute table until the schema test passes. (`searchDuration` shipped as
      `string`, not `enumeration` — DEC-4, discovered during 4.2's boot check.)
- [x] 1.3 Create the core-factory `controllers/survey-sender-v2.js`, `routes/survey-sender-v2.js`,
      `services/survey-sender-v2.js` (identical shape to `src/api/survey-sender/`).

## 2. Access control

- [x] 2.1 Verify (by reading `config/` and the users-permissions default) that a fresh
      collection-type grants no public/authenticated permissions unless explicitly seeded —
      confirms no bootstrap code is needed to satisfy the "no public role" requirement.
      No app-code change expected here — this task is a check, not a build step.

## 3. Docs

- [x] 3.1 Add a `survey-sender-v2` checklist entry to `docs/DEPLOY-RUNBOOK.md`'s API-token
      permissions section, mirroring the existing `waitlist-submission` entry: grant `create`
      on `survey-sender-v2` to the frontend's `STRAPI_API_TOKEN`; note the deploy-order
      constraint (perms live → then the frontend deploy that flips `/sondaj/expeditori` to v2).

## 4. Verify

- [x] 4.1 Run `npm test` — full suite green, including the new schema test.
- [x] 4.2 `npm run develop` locally, confirm Strapi boots without schema errors and
      `GET /api/survey-sender-v2s` (unauthenticated) returns `403`, not `404` — confirms the
      collection and its plural id are live and access-controlled. (First boot attempt failed on
      `searchDuration`'s enumeration values — see DEC-4; fixed, reboot succeeded.)
- [x] 4.3 `openspec validate --strict` passes for this change.

## Roadmap

- [x] 1.1 · [x] 1.2 · [x] 1.3 · [x] 2.1 · [x] 3.1 · [x] 4.1 · [x] 4.2 · [x] 4.3

## Verification

`npm test` (schema test) + a local `strapi develop` boot check confirm the collection exists,
matches the spec field-for-field, and is inaccessible to anonymous callers; `openspec validate
--strict` confirms the artifact shape.
