# DALKO CRM (MyCRM PoC)

Proof-of-concept CRM for DALKO Resources, built from the Word specs in `Library/` and `Design Rules.md`.

## Repository layout

| Path | Purpose |
|------|---------|
| `Main/` | Next.js application (the demo app) |
| `Library/` | Designer specs (source of truth) |
| `Design Rules.md` | Theme and UX rules |
| `MyCRM-PoC-Plan.md` | Build plan |
| `ACCURACY.md` | Spec coverage tracker |

## Run locally

```powershell
cd Main
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to `/leads`.

## Live demo (Vercel)

The app deploys from the `Main/` folder. Vercel build runs `db:seed` so sample data is loaded automatically.

1. Import this repo at [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** to `Main`
3. Deploy (defaults work: `npm run build`)

On first request, the app copies `Main/seed/mycrm.demo.sqlite` into runtime storage so demo data loads automatically.

## Stack

Next.js 16 · TypeScript · Tailwind CSS 4 · SQLite (`better-sqlite3`) · local file uploads
