# MyCRM (Main)

Local proof of concept for DALKO **MyCRM**, guided by the Word specs in `../Library` and `../Design Rules.md`.

This app is **not** connected to the production TMS database. It uses SQLite + local file uploads so you can demo the Lead / Attachments experience without blocking the programming team.

## Workspace

```
DALKO CRM/
├── Library/           # designer specs (source of truth)
├── Design Rules.md    # theme + UX rules for every new UI piece
├── MyCRM-PoC-Plan.md  # build plan
└── Main/              # this application
```

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- SQLite via `better-sqlite3` (`data/mycrm.sqlite`)
- Attachments stored under `uploads/<companyId>/`

## Brand assets

Drop brand images in `images/`. The app serves copies from `public/brand/`.

| Source | Served as |
|--------|-----------|
| `images/Logo1.png` | `/brand/Logo1.png` (top-bar logo) |

## Modular layout

| Folder | Role |
|--------|------|
| `src/app` | Routes only (thin) |
| `src/components` | UI (shell, leads, lead-detail) |
| `src/domain` | Business rules (status pipeline, formatting lists) |
| `src/data` | DB / file repositories |
| `src/lib` | DB client, paths, ids |

UI never talks to SQLite directly — go through `src/data`.

## Setup

```bash
cd Main
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/leads`).

## PoC scope (v1)

- MyCRM shell (top bar, nav, footer)
- Leads list (status / salesperson / name filters)
- Add / Edit Lead (Company Information, basic Contacts, status flow)
- Attachments (select / drag-drop, view, rename, delete; Email is stubbed)
- Other detail sections stubbed to match Library layout

## Out of scope

- Real TMS/DB, auth/SSO, scanner devices, Prospects/Clients full screens, mass import/export, live email, permissions matrix

## Design reference

Before building any new screen or control, read **`../Design Rules.md`**.

## Handoff

When the TMS team has bandwidth, treat this PoC as a clickable reference for routes, domain terms, and attachment flows. Re-implement against the production stack using the same module boundaries under `src/`.
