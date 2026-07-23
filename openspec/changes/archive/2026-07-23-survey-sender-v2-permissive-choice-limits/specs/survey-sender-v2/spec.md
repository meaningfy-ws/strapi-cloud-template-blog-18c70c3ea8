## MODIFIED Requirements

### Requirement: Multi-select fields with an "Other" free-text companion
The system SHALL define `howFindTransporter`, `difficulties`, `decisionCriteria`, `trustSignals`,
and `switchReasons` as JSON array fields, each paired with an optional free-text
`<field>Other` field for the `altceva` option. The system SHALL NOT enforce a maximum number of
selected entries on any of these fields server-side — any cap (e.g. the frontend's "max 3" on
`difficulties`, `decisionCriteria`, `trustSignals`, `switchReasons`) is a frontend-only
constraint. Required-ness (the field itself must be present) is unaffected by this permissiveness.

#### Scenario: Multi-select value is stored as a JSON array
- **WHEN** a payload sets `difficulties: ["nu_gasesc_rapid", "pret_neclar"]`
- **THEN** the entry SHALL persist the array as given

#### Scenario: "Other" free text accompanies the altceva option
- **WHEN** a payload sets `difficulties` to include `altceva` and provides `difficultiesOther`
  with the free-text detail
- **THEN** the entry SHALL persist both fields; `difficultiesOther` remains optional and unused
  when `altceva` isn't selected

#### Scenario: A selection count above the frontend's documented cap is still accepted
- **WHEN** a payload sets `difficulties` to more entries than the frontend's own "max 3" cap
  (e.g. 5 values)
- **THEN** the creation SHALL still succeed — the backend enforces no upper bound on any
  multi-select field's array length
