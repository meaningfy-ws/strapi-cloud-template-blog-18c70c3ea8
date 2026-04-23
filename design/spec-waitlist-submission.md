# Spec: `waitlist-submission` collection type

Updates the existing collection to replace the single `contact` field with separate
`email` and `whatsapp` fields, and makes `routes` mandatory.

---

## Fields

| Field | Strapi type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Display name |
| `email` | email | yes | Primary identity anchor |
| `whatsapp` | string | no | International format, e.g. `+352 621 123 456` |
| `role` | enumeration | yes | Values: `expeditor`, `transportator`, `ambele` — default: `expeditor` |
| `routes` | string | yes | Free text, one or more routes, e.g. `luxembourg - chișinău, milano - chișinău` |

---

## Validation notes

- At least `email` must be present — it is the identity anchor used to link records across collections.
- `whatsapp` is optional but encouraged; the form should make this clear without blocking submission.
- `routes` is required. No strict format enforcement at the schema level — store raw input and normalise downstream. The form should provide a placeholder example to guide input.
- `role` must be one of the three enum values; defaults to `expeditor` if not set.

---

## Changes from current schema

| Old field | Status | Replacement |
|---|---|---|
| `contact` (string) | removed | split into `email` + `whatsapp` |
| `route` (string, optional) | renamed + promoted | `routes` (string, required) |

All other fields (`name`, `role`) are unchanged.

---

## Draft & publish

Keep **Draft & Publish disabled** — submissions are operational records, not editorial content.
