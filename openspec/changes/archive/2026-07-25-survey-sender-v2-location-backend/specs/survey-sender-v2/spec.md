## ADDED Requirements

### Requirement: Optional approximate location capture
The system SHALL define `location` as an optional JSON attribute on `survey-sender-v2`, holding
either a browser-geolocation result (`{source: "geolocation", lat, lon, accuracyMeters}`), an
IP-resolved fallback (`{source: "ip", city, country}`), or `null`/omitted when neither resolves.
This is the same shape as `waitlist-submission.location`, reused verbatim.

#### Scenario: Submission without a location value still succeeds
- **WHEN** a payload is created via `POST /api/survey-sender-v2s` with no `location` key at all
- **THEN** the creation SHALL succeed exactly as before this field existed

#### Scenario: Submission with location: null succeeds
- **WHEN** a payload includes `location: null`
- **THEN** the creation SHALL succeed and the entry's `location` SHALL be `null`

#### Scenario: Submission with a resolved geolocation value is persisted unmodified
- **WHEN** a payload includes `location: {source: "geolocation", lat, lon, accuracyMeters}`
- **THEN** the creation SHALL succeed and the value SHALL be visible unmodified on the entry

#### Scenario: Submission with an IP-resolved fallback value is persisted unmodified
- **WHEN** a payload includes `location: {source: "ip", city, country}`
- **THEN** the creation SHALL succeed and the value SHALL be visible unmodified on the entry

### Requirement: No location-consent field
The system SHALL NOT define a `locationConsent` attribute on `survey-sender-v2`. Unlike
`waitlist-submission`, this form's location request is silent (no consent UI), so
`location.source` alone carries the distinction a consent field would otherwise duplicate.

#### Scenario: Schema has no consent attribute for location
- **WHEN** the `survey-sender-v2` schema is inspected
- **THEN** it SHALL NOT contain a `locationConsent` attribute
