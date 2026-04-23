# hulubul.com — Backend (Strapi CMS)

Content management and REST API backend for **hulubul.com**, a diaspora package transport platform connecting senders and transporters between Moldova and Western Europe.

This repository is one half of the platform. The frontend lives at [meaningfy-ws/hulubul-front](https://github.com/meaningfy-ws/hulubul-front).

---

## Live deployments

| Service | URL | Tier |
|---|---|---|
| Strapi admin | [Strapi Cloud](https://cloud.strapi.io) (free tier) | Free |
| Frontend | Vercel (free tier) | Free |
| Auth (SSO) | Zitadel Cloud (free tier) | Free |

---

## Tech stack

| Technology | Role |
|---|---|
| [Strapi v5](https://strapi.io) | Headless CMS — content types, REST API, admin panel |
| [Next.js](https://nextjs.org) | Frontend framework (see hulubul-front repo) |
| [Zitadel](https://zitadel.com) | SSO / identity provider — OAuth2/OIDC for user auth |
| [Photon by Komoot](https://photon.komoot.io) | Geocoding — city name → coordinates (OpenStreetMap data, no rate limit) |
| [Leaflet](https://leafletjs.com) + OpenStreetMap | Interactive route maps on the frontend |
| SQLite (dev) / PostgreSQL (cloud) | Database |

---

## Repositories

| Repo | Description |
|---|---|
| `meaningfy-ws/strapi-cloud-template-blog-18c70c3ea8` | **This repo** — Strapi backend, content types, lifecycles |
| [meaningfy-ws/hulubul-front](https://github.com/meaningfy-ws/hulubul-front) | Next.js frontend — landing page, forms, route maps |

---

## Content model

```
transport-type  ←──(M:M)──  transporter  ──(1:M)──  route-schedule  ──(M:1)──  route
```

| Collection | Purpose |
|---|---|
| `waitlist-submission` | Landing page sign-ups (name, email, whatsapp, role, routes) |
| `survey-sender` | Research survey — habitual senders' experience and pain points |
| `survey-transporter` | Research survey — active transporters' operations and pain points |
| `transport-type` | Admin-managed lookup — categories of goods/services |
| `route` | Named city corridors with auto-geocoded GeoJSON paths |
| `transporter` | Operator profiles (individual or company) |
| `route-schedule` | Junction: who travels which route, how often, which days |
| `landing-page` | Single type — all content for the hulubul.com landing page |

---

## Local development

```bash
npm install
npm run develop
```

Copy `.env.example` to `.env` and fill in secrets before starting. Key variables:

```
GEO_SERVICE_URL=https://photon.komoot.io   # Geocoding endpoint (default: Photon)
GEO_SERVICE_TOKEN=                          # Optional bearer token for private geocoding instance
```

The admin panel runs at `http://localhost:1337/admin`.

---

## Design specs

Detailed data model specifications live in [`design/`](./design/):

- [`spec-waitlist-submission.md`](./design/spec-waitlist-submission.md)
- [`spec-survey-senders.md`](./design/spec-survey-senders.md)
- [`spec-survey-transporters.md`](./design/spec-survey-transporters.md)
- [`spec-transporters-routes.md`](./design/spec-transporters-routes.md)
