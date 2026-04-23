# Spec: Transporters & Routes

Four new collections modelling the transport network: lookup types, routes with
geocoded paths, transporter profiles, and the schedule junction that connects them.

---

## Overview

```
transport-type  ←──(M:M)──  transporter  ──(1:M)──  route-schedule  ──(M:1)──  route
```

- **`transport-type`** — admin-managed lookup; extensible without code changes
- **`route`** — a named city path with geocoded GeoJSON, managed by admin
- **`transporter`** — a company or individual offering transport on one or more routes
- **`route-schedule`** — junction linking a transporter to a route with timing details

All collections have `status` for future self-registration support. No auth wiring now —
just the fields, defaulting to `approved` for admin-entered records.

---

## Collection: `transport-type`

Extensible lookup. Admin creates and manages types from the CMS panel — no code deploy
needed to add new categories.

| Field | Strapi type | Required | Notes |
|---|---|---|---|
| `label` | string | yes | Human-readable display name, e.g. `Colete & pachete` |
| `slug` | uid (from `label`) | yes | URL-safe identifier, e.g. `colete-pachete` |
| `description` | text | no | Optional explanation shown in admin and potentially in UI |

**Draft & Publish:** disabled — these are operational lookup records.

**Initial values to seed:**

| label | slug | description |
|---|---|---|
| Colete & pachete | colete-pachete | Pachete mici și medii, sub 30 kg |
| Transport persoane | transport-persoane | Locuri disponibile în mașină pe rută |
| Marfă voluminoasă | marfa-voluminoasa | Mobilă, electrocasnice, mărfuri mari |
| Automobile | automobile | Transport autoturisme pe platformă sau conduse |

---

## Collection: `route`

A named sequence of cities forming a travel corridor. The `citiesText` field is entered
by the admin; the `geoJson` field is computed automatically via a Strapi lifecycle hook
that calls the Nominatim (OpenStreetMap) geocoding API on save.

| Field | Strapi type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Short display name, e.g. `Luxembourg → Chișinău` |
| `citiesText` | string | yes | Comma-separated ordered city list: `Luxembourg, Metz, Lyon, Milano, Venezia, Chișinău` |
| `geoJson` | json | no | Computed GeoJSON LineString — auto-filled on save, editable by admin to correct bad geocodes |
| `status` | enumeration | yes | `draft`, `approved`, `suspended` — default: `approved` |
| `submittedBy` | string | no | Email of the person who created this record |
| `claimedBy` | string | no | Email of the transporter who will own this record when self-registration launches |

**Draft & Publish:** disabled.

**Lifecycle hook behaviour:**
- Fires on `beforeCreate` and `beforeUpdate`
- Triggers only when `citiesText` has changed
- Parses city names, calls Nominatim for each, builds a `LineString` GeoJSON
- Writes result into `data.geoJson`
- On geocoding failure: logs warning, leaves `geoJson` null — admin is notified via
  the Strapi admin response that geocoding failed and must be corrected manually

**`geoJson` field structure:**
```json
{
  "type": "LineString",
  "coordinates": [
    [6.1296, 49.6116],
    [6.1757, 49.1193],
    [4.8357, 45.7640],
    [9.1900, 45.4654],
    [12.3155, 45.4408],
    [28.8576, 47.0056]
  ]
}
```

---

## Collection: `transporter`

A transport operator — either an individual driver or a registered company — offering
services on one or more routes.

| Field | Strapi type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Full name or company name |
| `type` | enumeration | yes | `individual`, `company` — default: `individual` |
| `phoneNumbers` | json | yes | Ordered array of international phone strings: `["+352621123456", "+37369123456"]` — must start with `+` or `00` |
| `transportTypes` | relation → `transport-type` (many-to-many) | no | What the transporter carries — references `transport-type` records |
| `notes` | text | no | Internal admin notes — not shown publicly |
| `status` | enumeration | yes | `draft`, `approved`, `suspended` — default: `approved` |
| `submittedBy` | string | no | Email of the person who created this record |
| `claimedBy` | string | no | Email of the transporter for future self-managed profile |

**Draft & Publish:** disabled.

**Phone number validation note:** no strict regex at schema level — store raw input.
Frontend and admin should guide entry with placeholder `+352 621 123 456`. Normalise
on read if needed.

---

## Collection: `route-schedule`

Junction table connecting a transporter to a route with precise timing information.
One transporter may have multiple schedules (e.g. different frequencies per route,
or seasonal variations).

| Field | Strapi type | Required | Notes |
|---|---|---|---|
| `transporter` | relation → `transporter` (many-to-one) | yes | |
| `route` | relation → `route` (many-to-one) | yes | |
| `frequency` | enumeration | yes | `weekly`, `biweekly`, `monthly`, `on_demand` |
| `departureDays` | json | yes | Array of day codes: `["wed"]`, `["mon", "thu"]` — values: `mon tue wed thu fri sat sun` |
| `arrivalDays` | json | yes | Same day code array for expected arrival |
| `notes` | text | no | Free text for irregular patterns, seasonal variations, or extra detail |
| `status` | enumeration | yes | `draft`, `approved`, `suspended` — default: `approved` |

**Draft & Publish:** disabled.

**Departure/arrival day codes:** `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`.
Arrays allow multi-day patterns, e.g. a transporter who departs Wednesday or Friday.

---

## Summary

| Collection | Fields | Purpose |
|---|---|---|
| `transport-type` | 3 | Admin-extensible lookup — no deploys for new types |
| `route` | 6 | City corridors with geocoded map paths |
| `transporter` | 8 | Operator profiles with contact and capability info |
| `route-schedule` | 7 | Timing junction — who travels where, how often, which days |

**Relationships:**
- `transporter` ↔ `transport-type`: many-to-many (a transporter carries multiple types)
- `route-schedule` → `transporter`: many-to-one (many schedules per transporter)
- `route-schedule` → `route`: many-to-one (many schedules per route)

**Future self-registration path:**
`status`, `submittedBy`, and `claimedBy` fields are present on `route`, `transporter`,
and `route-schedule`. When self-registration launches, new records default to `draft`
and require admin approval before appearing publicly. No migration needed.

---

## Out of scope

- Authentication / permissions wiring for self-registration
- Frontend map rendering (separate frontend repository)
- Geocoding service selection beyond Nominatim (can be swapped via env var)
- Transporter ratings or reviews
