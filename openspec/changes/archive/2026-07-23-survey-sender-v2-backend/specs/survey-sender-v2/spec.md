## ADDED Requirements

### Requirement: Collection shape
The system SHALL expose a Strapi collection-type `survey-sender-v2`, separate from
`survey-sender`, with `draftAndPublish` disabled so every submission is immediately persisted.

#### Scenario: New submission is persisted without draft state
- **WHEN** a valid payload is created via `POST /api/survey-sender-v2s`
- **THEN** the created entry has no draft/published distinction and is immediately visible to
  authorized readers

### Requirement: Identity fields
The system SHALL require `name` (string, max 200) and `email` (email format) on every entry.

#### Scenario: Missing name is rejected
- **WHEN** a payload omits `name`
- **THEN** the creation SHALL fail validation

#### Scenario: Missing email is rejected
- **WHEN** a payload omits `email`
- **THEN** the creation SHALL fail validation

### Requirement: Structured two-city route
The system SHALL store `routeCities` as a required JSON field representing exactly two free-text
city names (`[origin, destination]`), with no server-side gazetteer validation.

#### Scenario: Route captured as an origin/destination pair
- **WHEN** a payload includes `routeCities: ["Chisinau", "Berlin"]`
- **THEN** the entry SHALL persist the array as given, without validating the city names against
  any external source

### Requirement: Required single-choice enums match the frontend contract
The system SHALL define `sendingFrequency` and `wantsToTest` as required enumeration fields
whose values match `lib/survey-schema-v2.ts` character-for-character.

#### Scenario: sendingFrequency accepts only the canonical values
- **WHEN** a payload sets `sendingFrequency` to `niciodata`, `rar`, `cateva_ori_pe_an`,
  `la_2_3_luni`, or `lunar_sau_mai_des`
- **THEN** the creation SHALL succeed

#### Scenario: sendingFrequency rejects an unknown value
- **WHEN** a payload sets `sendingFrequency` to a value outside the canonical enum
- **THEN** the creation SHALL fail validation

#### Scenario: wantsToTest accepts only the canonical values
- **WHEN** a payload sets `wantsToTest` to `da`, `posibil`, or `nu`
- **THEN** the creation SHALL succeed

### Requirement: searchDuration is a required string field, not a schema-enforced enum
The system SHALL define `searchDuration` as a required string field whose canonical value set
(`sub_5_min`, `5_15_min`, `15_30_min`, `30_60_min`, `cateva_ore`, `o_zi_sau_mai_mult`,
`nu_se_aplica`) matches `lib/survey-schema-v2.ts` character-for-character, but is documented as
a contract rather than enforced by Strapi's schema validation — three of the canonical values
start with a digit, which Strapi's `enumeration` type rejects unconditionally (GraphQL
enum-naming rule in `@strapi/core`).

#### Scenario: searchDuration accepts any of the canonical values
- **WHEN** a payload sets `searchDuration` to one of the 7 canonical values
- **THEN** the creation SHALL succeed

#### Scenario: searchDuration also accepts a value outside the canonical set
- **WHEN** a payload sets `searchDuration` to a string not in the canonical set
- **THEN** the creation SHALL still succeed at the Strapi layer — the frontend's Zod schema is
  the only gate enforcing the canonical set, same treatment as the JSON multi-select fields

### Requirement: Multi-select fields with an "Other" free-text companion
The system SHALL define `howFindTransporter`, `difficulties`, `decisionCriteria`, `trustSignals`,
and `switchReasons` as JSON array fields, each paired with an optional free-text
`<field>Other` field for the `altceva` option.

#### Scenario: Multi-select value is stored as a JSON array
- **WHEN** a payload sets `difficulties: ["nu_gasesc_rapid", "pret_neclar"]`
- **THEN** the entry SHALL persist the array as given

#### Scenario: "Other" free text accompanies the altceva option
- **WHEN** a payload sets `difficulties` to include `altceva` and provides `difficultiesOther`
  with the free-text detail
- **THEN** the entry SHALL persist both fields; `difficultiesOther` remains optional and unused
  when `altceva` isn't selected

### Requirement: Free-text summary field
The system SHALL require `mostImportantThing` as a free-text field capturing a single
open-ended answer.

#### Scenario: Missing mostImportantThing is rejected
- **WHEN** a payload omits `mostImportantThing`
- **THEN** the creation SHALL fail validation

### Requirement: Alpha-test opt-in fields are optional and unenforced server-side
The system SHALL define `testPhone` (string) and `testConsent` (boolean) as optional fields with
no server-side format validation or conditional-required gating, matching how
`wantsCallback`/`callbackPhone` are scoped for `survey-sender` today — enforcement of "required
when `wantsToTest !== nu`" is the frontend Zod schema's responsibility only.

#### Scenario: Entry with wantsToTest=da but no testPhone/testConsent still persists
- **WHEN** a payload sets `wantsToTest: "da"` and omits `testPhone` and `testConsent`
- **THEN** the creation SHALL succeed at the Strapi layer (the frontend's own Zod gate is what
  would have blocked this payload from being sent)

### Requirement: Access control excludes the public role
The system SHALL grant no `find`/`create`/`update`/`delete` permissions to the public
users-permissions role on `survey-sender-v2`. Write access SHALL be limited to the trusted
Bearer API token configured in Strapi Admin, mirroring `survey-sender`'s access model.

#### Scenario: Anonymous create is rejected
- **WHEN** a `POST /api/survey-sender-v2s` request carries no Bearer token
- **THEN** the request SHALL be rejected with `403`

#### Scenario: Authorized token can create
- **WHEN** a `POST /api/survey-sender-v2s` request carries the Bearer token granted `create` on
  this collection
- **THEN** the request SHALL succeed with `201`
