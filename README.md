# منظومة المكتب الفني — Technical Office (frontend)

Frontend of the Technical Office System for a construction technical office. It replaces an old
desktop system. The UI is **Arabic only (RTL)**.

- **Next.js 16 + React 19**, Tailwind CSS 4, Redux Toolkit + **RTK Query**, react-hook-form + zod, axios.
- **UI only.** All business logic, data and auth live in the separate ASP.NET Core API.
- Built as a **static export** (`out/`), so it can later be wrapped as a desktop app with **Tauri**.
  That means: no Server Actions, no API routes, no middleware, no server-only dynamic routes.
  All data is fetched on the client.

## Requirements

- Node.js 20+ and npm
- The backend API running (default dev URL `http://localhost:5133`)

## Configuration: API URL

The app needs the backend's origin (without `/api`). There are two ways to set it:

| Option | When | How |
| --- | --- | --- |
| **`/config.json`** (runtime) | Desktop (Tauri) / any install where the URL differs per site | Put a `config.json` next to `index.html`. See `public/config.example.json`: `{ "apiUrl": "https://api.example.com" }` |
| **`NEXT_PUBLIC_API_URL`** (build time) | Local dev, Vercel | Copy `.env.example` to `.env.local`, or set the variable in the hosting dashboard |

At startup the app loads `/config.json` **before the first API call** (5 s timeout). If the file is
missing or has no `apiUrl`, it falls back to `NEXT_PUBLIC_API_URL`, then to `http://localhost:5133`.
A failed request (network error, timeout, server error) is not cached: that call uses the fallback
and the next API call tries `/config.json` again.

- **Local dev:** use `.env.local` (`NEXT_PUBLIC_API_URL`). Do **not** create `public/config.json`:
  everything in `public/` is copied into `out/`, so it would ship inside the build (e.g. the desktop
  app). `npm run build` refuses to run while `public/config.json` exists (`scripts/check-public-config.mjs`).
- **Installed build:** add `config.json` next to `index.html` **after** the build (e.g. `out/config.json`,
  or the copy bundled into the desktop app). It can be changed without rebuilding.

## Development

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5133
npm run dev                  # http://localhost:3000
```

Other scripts:

```bash
npm run lint    # ESLint (must pass with 0 errors / 0 warnings)
npm run build   # static export to out/
```

## Build (static export)

`npm run build` writes plain static files to **`out/`** (`output: 'export'`, `trailingSlash: true`,
unoptimized images). Serve that folder with any static file server, or bundle it with Tauri.
Add `out/config.json` to point the build at an API without rebuilding.

## Deploy on Vercel

1. Import the repository in Vercel (framework preset: Next.js).
2. Set the environment variable **`NEXT_PUBLIC_API_URL`** to the API origin, e.g. `https://api.example.com`.
3. Deploy. No `config.json` is needed; the env var is used as the fallback.

The backend must allow the site's origin in its CORS settings.

## Project structure (short)

```
src/
  app/                 routes: (auth)/login, (all)/ (protected pages: home, /data, /data/<lookup>, /contracts, /statements)
  components/          shell, guards, module cards, ui/ (Button, Input, Modal, ...)
    list/              reusable list screen: URL list state + filters, page shell, table, toolbar filters, cells
    lookup/            name-only lookup screen (built on list/)
    attachments/       shared attachment upload/view/delete pieces (also per category)
    form/              shared form fields: dropdown from an options list, select, clearable date, decimal
    options/           options endpoints → dropdown lists (+ filter helpers)
    print/             in-app A4 print view + export → print flow (طباعة / PDF)
    companies/         الشركات screen with attachments (built on list/)
    projects/          المشاريع screen: status filter, materials rows, attachments per category
    company-materials/ خامات الشركات screen: dropdown filters, total quantity, print / PDF view
    material-deliveries/ خامات المشاريع screen (one row per delivery): filters, totals panel, print
    contracts/         العقود screen: status + السلفة + المستخلص counters, filters, totals, print, sections form, الأوراق المستلمة
    statements/        المستخلصات screen + the statement dialog (also opened from a contract) and the contract section
  lib/                 axios, runtime config, session, theme, lookups list
  rtk/                 store, base API (api.ts), endpoints/, slices/
  types/               API types (auth, lookups, paged results)
```

## How to add a new lookup page

Name-only lookups (like الجهات and القطاعات) share one screen (`src/components/lookup/LookupPage.tsx`).
The backend must expose the same endpoints at `/api/{resource}`.

1. Add an entry to `LOOKUPS` in `src/lib/lookups.ts`:

   ```ts
   { resource: "project-types", title: "انواع المشاريع", fieldLabel: "نوع المشروع" },
   ```

   `resource` is both the API resource (`/api/project-types`) and the route (`/data/project-types`).
   This also types the resource and sets the breadcrumb label.

2. Add the route file `src/app/(all)/data/project-types/page.tsx`:

   ```tsx
   import LookupPage from "@/components/lookup/LookupPage";

   export default function ProjectTypesPage() {
     return <LookupPage resource="project-types" />;
   }
   ```

3. Point its card in `sections` in `src/app/(all)/data/page.tsx` at the lookup (the title and link
   then come from `LOOKUPS`; a mistyped resource fails the type check):

   ```ts
   { title: "انواع المشاريع", icon: Tags },        // before: "قريبًا" placeholder
   { lookup: "project-types", icon: Tags },        // after: active link
   ```
