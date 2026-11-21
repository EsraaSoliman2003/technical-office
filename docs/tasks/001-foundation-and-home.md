# Task 001 (Frontend): Foundation, auth and home page

## Context

This is the frontend of **منظومة المكتب الفني** (Technical Office System) for a construction technical office.
It replaces an old desktop system. The app is **Arabic only** (RTL).

- Backend: ASP.NET Core API (separate repo), default dev URL `http://localhost:5133`.
- The current code was started from another project, so its API calls, auth and some config
  do **not** match our backend. This task fixes the foundation and builds the home page.
- **Desktop later:** the app will be wrapped with **Tauri**, so it must build with
  `output: 'export'` (static files only). That means: no Server Actions, no API routes,
  no `cookies()`/`headers()` from `next/headers`, no middleware, no server-only dynamic routes.
  All data is fetched on the client from the .NET API.

Keep the existing stack: Next.js 16, React 19, Tailwind 4, Redux Toolkit, react-hook-form + zod,
axios, sonner, lucide-react.

## Backend API contract (already implemented)

- Base URL: `${NEXT_PUBLIC_API_URL}/api/` (no `/v1`).
- `POST /api/auth/login` body `{ "email", "password" }` →
  `200 { accessToken, expiresAt, userId, fullName, email, role }`.
  `role` is `Admin` | `Manager` | `Employee`.
- `GET /api/auth/me` (Bearer token) → `{ id, email, name, role }`.
- There is **no** register and **no** logout endpoint (logout = drop the token on the client).
- Errors are **RFC 7807 ProblemDetails** JSON (no `{ success, data }` envelope):
  - `400` `{ title, status, errors: { fieldName: ["msg", ...] } }` (validation)
  - `401` / `403` / `404` / `409` / `500` `{ title, status, detail?, errors? }`
  - Messages are already in Arabic — show them as they come.

## Requirements

### 1. Clean up leftovers

- Remove: the register page, `useRegisterForm`, `registerSchema`, register code in `authSlice`
  and `dtos.ts`, the `(all)/companies` placeholder page (companies will be rebuilt later under `/data`),
  the `admin.packadgek.com` image config, and the `headers()` CORS block in `next.config.ts`
  (CORS is handled by the backend).
- Remove unused dependencies: `@mantine/core`, `@react-oauth/google`, `libphonenumber-js`
  (check each is really unused first). Use **one** icon library: `lucide-react` (remove `react-icons` if unused after cleanup).
- `next.config.ts`: `output: 'export'`, `images: { unoptimized: true }`, `trailingSlash: true`.
- Add `.env.example` with `NEXT_PUBLIC_API_URL=http://localhost:5133`.

### 2. API layer

- `src/lib/axios.ts`: baseURL `${NEXT_PUBLIC_API_URL}/api/`, Bearer token from the auth store/cookie.
  On **401** from any request except login: clear the session and redirect to `/login`.
- Rewrite `utils/apiFailure.ts` to parse ProblemDetails: `message` = `detail || title`,
  `fieldErrors` = `errors` (keys as-is, camelCase), `networkError` when there is no response,
  plus `status`. Network error message: `"تعذر الاتصال بالخادم"`.
- Use **RTK Query** (part of `@reduxjs/toolkit`) for server data from now on: create `src/rtk/api.ts`
  with a base query on top of the axios instance. Feature tasks will add endpoints with `injectEndpoints`.

### 3. Auth

- Login form: fields `email` (valid email) + `password` (required), Arabic labels and zod messages.
  Map server `fieldErrors` onto fields; show other errors above the form.
- On success store the token **on the client only** (cookie via `cookies-next` client API, or
  `localStorage` — pick one, wrap it in `src/lib/session.ts`) plus `fullName`, `role`, `expiresAt`
  in the auth slice. Restore the session on app load **on the client** (remove `cookies()` from
  the root layout). Treat an expired token (`jwt-decode` `exp`) as logged out.
- Route guard (client side): every page under `(all)` requires a session, otherwise redirect to
  `/login`. `/login` redirects to `/` when already logged in. Avoid a flash of protected content
  (show a full-page loader while the session is being restored).
- Logout: clear session + store, redirect to `/login`.

### 4. App shell and global setup

- Root layout: `<html lang="ar" dir="rtl">`, Cairo font via `next/font` (remove the duplicate
  Google Fonts `@import` from `globals.css`), mount sonner `<Toaster richColors position="top-center" dir="rtl" />`
  (it is not mounted today).
- Theme tokens in `globals.css` (Tailwind 4 `@theme`): primary **dark red** `#8B1E1E`,
  accent **gold** `#C9A227`, plus neutrals. Support light and dark mode with a toggle in the user
  menu (remember the choice in `localStorage`, default: light).
- Shell (`TechnicalOfficeShell`): top bar with logo (`/public/logo.png` — add a placeholder; the real
  logo will be supplied) and the title **"منظومة المكتب الفني"** on the right; on the left a user menu
  showing the user's full name with: الإعدادات (disabled for now), تبديل المظهر (theme toggle), تسجيل الخروج.
  A breadcrumb row under the top bar on inner pages (e.g. الرئيسية / البيانات / الجهات).
  Remove the sidebar unless it is needed by the design above.

### 5. Home page (`/`)

Rebuild the old home page with a modern style:

- A hero section with **"بسم الله الرحمن الرحيم"** and the verse
  **"وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ"** in an elegant style,
  with the logo as a faint watermark in the background.
- A grid of **8 module cards** (4 per row on desktop, 2 on tablet, 1 on phone), in this order:
  موقف المشاريع، التمام اليومي، البيانات، العقود، سلفة + مستخلص، الخامات، الجوابات، المحاضر.
  Each card: lucide icon, title, whole card clickable, hover/focus states, keyboard accessible.
- Only **البيانات** is active now → links to `/data`. The others are visibly disabled with a
  small "قريبًا" badge.
- Remove the current placeholder dashboard content (search bar, tabs, task table).

### 6. Data hub page (`/data`)

The old system opened a menu with the master-data lists. Make it a page of cards grouped by section:

- **الجهات والقطاعات:** الجهات (`/data/agencies`), القطاعات (`/data/sectors`)
- **المشاريع:** المشاريع، انواع المشاريع
- **الشركات:** الشركات، شركات النقل
- **الخامات:** الخامات، خامات الشركات، خامات المشاريع، المصانع، الخلطات
- **التقارير:** تقرير العقود

Only الجهات and القطاعات are active (their pages come in task 002 — link to them anyway);
the rest show "قريبًا".

### 7. Shared UI kit (`src/components/ui`)

Small Tailwind components that the feature tasks will reuse: `Button` (variants: primary,
secondary, danger, ghost; loading state), `Input` (label, error text), `Modal` (focus trap,
`Esc` closes, RTL), `ConfirmDialog` (replaces the English `confirmDelete` toast — Arabic texts:
"تأكيد الحذف", "هل أنت متأكد من حذف هذا العنصر؟", "حذف", "إلغاء"), `Spinner`, `EmptyState`, `Badge`.

## Out of scope

- The الجهات / القطاعات pages themselves (task 002).
- Settings page, user management, Tauri packaging.

## Done when

- `npm run build` succeeds **with `output: 'export'`** and `npm run lint` has no errors.
- Login against the real backend works; wrong password shows the Arabic server message;
  refreshing the page keeps the session; logout works; an expired/invalid token sends you to `/login`.
- Home and `/data` pages match the description, are RTL, responsive, and work in light and dark mode.
- No English text visible in the UI.
- Work is on a new branch `feature/foundation-home` (not `main`), in small, clear commits.
- Final message lists: files changed/removed, dependencies removed, decisions, anything not done or assumed.
