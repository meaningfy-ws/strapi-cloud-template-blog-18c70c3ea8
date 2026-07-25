> Derived from EPIC: survey-sender-v2-location-backend (proposal.md)

## 1. Schema

- [x] 1.1 Add `location` (`json`, `required: false`) to
      `src/api/survey-sender-v2/content-types/survey-sender-v2/schema.json`.

## 2. Tests

- [x] 2.1 Add a schema test asserting `location` is `{type: "json", required: false}`
      (`tests/schemas/survey-sender-v2.test.js`).
- [x] 2.2 Add a schema test asserting no `locationConsent` attribute exists on the collection.

## 3. Verification

- [x] 3.1 Run the schema test suite and confirm it passes.

## Roadmap

- [x] 1.1 · [x] 2.1 · [x] 2.2 · [x] 3.1

## Verification

`node --test tests/schemas/survey-sender-v2.test.js` passes; existing full test suite unaffected.
