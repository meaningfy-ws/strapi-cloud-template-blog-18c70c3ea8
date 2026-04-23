# Spec: `survey-response` collection type

New collection. Captures habitual experience, mental model, and conversion intent from
people who have sent packages via informal channels (diaspora transporters).

Linked to `waitlist-submission` softly via `email` — no hard foreign key. Works both
as a follow-up survey (sent to waitlist members) and as a standalone page for new visitors.

---

## Identity block

Required for standalone visitors. Pre-filled or skipped for existing waitlist members.

| Field | Strapi type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | |
| `email` | email | yes | Soft link to `waitlist-submission.email` |
| `whatsapp` | string | no | |
| `role` | enumeration | yes | Values: `expeditor`, `transportator`, `ambele` |
| `routes` | string | no | Same format as waitlist — for context only |
| `source` | enumeration | yes | Values: `waitlist_followup`, `standalone`, `other` |

---

## Section: Context

Questions about habitual sending behaviour.

| Field | Strapi type | Required | Enum values / notes |
|---|---|---|---|
| `sendingFrequency` | enumeration | no | `niciodata`, `rar`, `cateva_ori_pe_an`, `lunar`, `mai_des` |
| `packageTypes` | json | no | Array of: `alimente`, `haine`, `electronice`, `documente`, `altele` |
| `packageTypesOther` | string | no | Free text — shown when `altele` selected in `packageTypes` |

---

## Section: Proces

Questions about how they currently find and engage transporters.

| Field | Strapi type | Required | Enum values / notes |
|---|---|---|---|
| `howFindTransporter` | json | no | Array of: `grup_facebook`, `recomandare`, `cunosc_personal`, `altul` |
| `howFindTransporterOther` | string | no | Free text — shown when `altul` selected |
| `searchDuration` | enumeration | no | `sub_o_ora`, `cateva_ore`, `una_doua_zile`, `mai_mult` |
| `contactedCount` | enumeration | no | `unul`, `doi_trei`, `mai_multi` — replaces boolean `contactedMultiple` |

---

## Section: Decizie

Questions about selection criteria and price sensitivity.

| Field | Strapi type | Required | Enum values / notes |
|---|---|---|---|
| `selectionCriteria` | json | no | Ordered array — index = rank. Values: `pret`, `siguranta`, `viteza`, `reputatie`, `recomandare` |
| `safetyPriceAttitude` | enumeration | no | `nu`, `uneori`, `da_depinde` — attitude, not past event |

---

## Section: Probleme

Questions about friction and pain in the current process.

| Field | Strapi type | Required | Enum values / notes |
|---|---|---|---|
| `painPointsStructured` | json | no | Array of: `gasit_transportator`, `negociere_pret`, `comunicare`, `siguranta`, `intarzieri`, `altele` |
| `painPointDetails` | text | no | Open elaboration after structured selection |
| `issuesExperienced` | json | no | Array of: `intarzieri`, `lipsa_comunicare` — independent checkboxes, no "ambele"/"niciuna" |

---

## Section: Încredere

Questions about trust signals and platform requirements.

| Field | Strapi type | Required | Enum values / notes |
|---|---|---|---|
| `trustSignals` | json | no | Array of: `recomandare_prieteni`, `profil_verificat`, `recenzii`, `altceva` |
| `platformTrustRequirements` | text | no | Open — what would need to exist for them to trust a platform |

---

## Section: Ideal

Open questions about the ideal experience. Split into two focused fields to avoid
unfocused combined answers.

| Field | Strapi type | Required | Notes |
|---|---|---|---|
| `idealExperience` | text | no | "Cum ar arăta experiența perfectă?" |
| `biggestTimeSaver` | text | no | "Ce ți-ar economisi cel mai mult timp?" |

---

## Section: Validare

Conversion and lead-qualification fields.

| Field | Strapi type | Required | Notes |
|---|---|---|---|
| `willShipSoon` | boolean | no | Will send a package in the next 2–4 weeks — hot lead flag |
| `wantsCallback` | boolean | no | Wants to be contacted with concrete options |
| `callbackPhone` | string | no | Collected only when `wantsCallback = true` |

---

## Summary

- **Total fields:** 25 (6 identity + 19 research/conversion)
- **Required fields:** `name`, `email`, `role`, `source`
- **All research fields:** optional — partial responses are valid and useful
- **`json` fields:** store arrays of string enum values; `selectionCriteria` is ordered (index 0 = highest priority)
- **Draft & Publish:** disabled — submissions are operational records

---

## Relationship to `waitlist-submission`

No Strapi relation field. Link is established at query time via `email` equality.
If a survey response arrives with an email that matches a waitlist record, they belong
to the same person. No foreign key needed at this stage.
