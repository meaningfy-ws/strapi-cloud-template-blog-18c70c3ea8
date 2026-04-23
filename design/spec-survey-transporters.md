# Spec: `survey-transporter` collection type

Sibling to `survey-sender`. Captures habitual operational experience, pain points,
capacity patterns, and platform interest from active diaspora transporters.

**Strapi collection name:** `survey-transporter`
**API UID:** `api::survey-transporter.survey-transporter`
**Sibling:** `api::survey-sender.survey-sender` (formerly `survey-response`)

Linked to `waitlist-submission` and `transporter` softly via `email` — no hard foreign key.
Works standalone (direct link) or as a follow-up sent to transporters on the waitlist.

---

## Note on "Zi reală" questions

The original brief included 3 questions about a specific current trip (*ce pregătești,
unde mergi, ce ai încărcat*). These are **trip declarations, not survey questions** —
they describe live capacity, not habitual behaviour. They are out of scope here and
belong in a future "post a trip" or transporter profile flow.

---

## Identity block

| Field | Strapi type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | |
| `email` | email | yes | Soft link to `waitlist-submission.email` and `transporter.claimedBy` |
| `whatsapp` | string | no | |
| `transporterType` | enumeration | no | `individual`, `company` — mirrors `transporter.type`, useful for segmentation |
| `source` | enumeration | yes | `waitlist_followup`, `standalone`, `other` — default: `standalone` |

---

## Section: Context

Habitual operational profile of the transporter.

| Field | Strapi type | Required | Enum values / notes |
|---|---|---|---|
| `experienceYears` | enumeration | no | `sub_un_an`, `unu_trei_ani`, `trei_cinci_ani`, `peste_cinci_ani` |
| `tripFrequency` | enumeration | no | `zilnic`, `de_mai_multe_ori_pe_saptamana`, `saptamanal`, `lunar` |
| `usualRoutes` | string | no | Free text — same format as `route.citiesText` |

---

## Section: Operațional

How the transporter currently runs their operation.

| Field | Strapi type | Required | Enum values / notes |
|---|---|---|---|
| `collectionPoints` | text | no | Where they collect packages from — open text |
| `departurePreparation` | text | no | What they do before a trip — open text |

---

## Section: Clienți

How they find and manage their current customer base.

| Field | Strapi type | Required | Enum values / notes |
|---|---|---|---|
| `howFindClients` | json | no | Array of: `grup_facebook`, `recomandare`, `clienti_fideli`, `anunturi_online`, `altul` |
| `howFindClientsOther` | string | no | Free text when `altul` selected |
| `hasCapacityGaps` | boolean | no | Combined: sometimes has empty space / not enough packages |
| `capacityGapsDetails` | text | no | Free text elaboration on capacity gaps |

---

## Section: Organizare

How they manage the logistics and pricing of their runs.

| Field | Strapi type | Required | Enum values / notes |
|---|---|---|---|
| `packageTracking` | text | no | How they keep track of packages — open text |
| `pricingMethod` | text | no | How they set prices — open text |
| `clientCommunication` | json | no | Array of: `whatsapp`, `telefon`, `facebook_messenger`, `email`, `altul` |

---

## Section: Probleme

Friction and pain in their current operation.

| Field | Strapi type | Required | Enum values / notes |
|---|---|---|---|
| `biggestChallenge` | text | no | Merged: hardest thing + biggest time cost — open text |
| `issuesExperienced` | json | no | Array of: `anulari_clienti`, `neintelegeri_pret`, `lipsa_comunicare`, `probleme_vama` — no "niciuna", empty array means no issues |
| `issuesDetails` | text | no | Free text elaboration |

---

## Section: Încredere

Boundaries and risk awareness.

| Field | Strapi type | Required | Enum values / notes |
|---|---|---|---|
| `refusedPackageTypes` | json | no | Array of: `bani_numerar`, `droguri`, `animale`, `obiecte_fragile`, `documente_oficiale`, `altele` |
| `hadCustomsIssues` | boolean | no | |
| `customsIssuesDetails` | text | no | Free text — shown when `hadCustomsIssues = true` |

---

## Section: Interes

Platform adoption signals and barriers.

| Field | Strapi type | Required | Enum values / notes |
|---|---|---|---|
| `preferredRequestChannel` | json | no | Array of: `whatsapp_direct`, `aplicatie_dedicata`, `email`, `telefon`, `altul` |
| `preferredRequestChannelOther` | string | no | Free text when `altul` selected |
| `platformBarriers` | text | no | What would stop them from using a new system — open text |

---

## Section: Validare

Conversion and lead-qualification fields.

| Field | Strapi type | Required | Notes |
|---|---|---|---|
| `hasUpcomingTrip` | boolean | no | Has space on a trip in the next 2–4 weeks — hot lead flag |
| `acceptsNewClients` | boolean | no | Would accept new clients if sent directly |
| `wantsCallback` | boolean | no | |
| `callbackPhone` | string | no | Collected only when `wantsCallback = true` |

---

## Summary

- **Total fields:** 26 (5 identity + 21 research/conversion)
- **Required fields:** `name`, `email`, `source`
- **All research fields:** optional — partial responses are valid
- **`json` fields:** arrays of string enum values
- **Draft & Publish:** disabled — operational records

---

## Sibling collections

| Collection | API UID | Target audience |
|---|---|---|
| `survey-sender` | `api::survey-sender.survey-sender` | People who send packages |
| `survey-transporter` | `api::survey-transporter.survey-transporter` | People who transport packages |

Both link softly to `waitlist-submission` via `email`. Neither has a hard foreign key.

---

## Relationship to `transporter` collection

When a transporter later claims their profile (`transporter.claimedBy = email`),
survey responses can be linked at query time via email equality. No migration needed.
