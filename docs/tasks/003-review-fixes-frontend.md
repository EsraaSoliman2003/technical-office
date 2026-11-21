# Task 003 (Frontend): Review fixes for tasks 001 and 002

## Context

Tasks 001 (foundation, on `main`) and 002 (lookup pages, branch `feature/agencies-sectors`) were reviewed.
Fix the items below **on branch `feature/agencies-sectors`** (it already contains `main`), in small
commits. Read `docs/tasks/001-foundation-and-home.md` and `002-agencies-sectors-pages.md` for context.

The rules from task 001 still apply: Arabic-only RTL UI, must build with `output: 'export'`,
client-side data and auth only.

## Should fix

1. **Out-of-range page** — `src/components/lookup/LookupPage.tsx` (~125, 146-151).
   `?page=9` from a bookmark, or rows deleted by another user, shows "لا توجد بيانات" while the
   footer says "عدد النتائج: 135". When data arrives and `page > totalPages` (and `totalPages > 0`),
   replace the URL with the last valid page. This also covers "deleted the last row of the page",
   so simplify that special case.

2. **`src/app/not-found.tsx` is from the old project.** Rebuild it with the theme tokens
   (light/dark), an Arabic message, and a real `<Link href="/">` "العودة للرئيسية"
   (today it calls `router.back()`). Remove the unused import (the only lint warning).

3. **Dead code.** Delete the ~500 lines of e-commerce types in `src/utils/dtos.ts` (keep only what is
   imported: `UserRole`, `LoginRequest`, `LoginResponse`, `MeResponse` — move them to `src/types/` next to
   the lookup types) and the `.react-tel-input` styles in `src/app/(auth)/style.css`
   (delete the file if nothing else is left).

4. **Vulnerable dependencies.** `npm audit` reports 1 critical + 7 high (next 16.2.12, axios,
   follow-redirects, postcss, nanoid, sharp). Upgrade to patched versions (`npm audit fix`, and bump
   `next` to the latest 16.x patch), align `eslint-config-next` with `next`. `npm audit` must report
   **0 critical / 0 high** at the end; mention anything that can't be fixed and why.

5. **API URL at runtime (needed for the Tauri desktop build).** Today `NEXT_PUBLIC_API_URL` is baked in
   at build time. Load `/config.json` (served next to `index.html`, e.g.
   `{ "apiUrl": "https://api.example.com" }`) once at startup **before** the first API call, and use
   `NEXT_PUBLIC_API_URL` as the fallback when the file is missing. Add `public/config.example.json`,
   don't commit a real `public/config.json` (gitignore it), and document both options in the README.
   On Vercel the env var keeps working unchanged.

## Nits (please fix too)

6. **Search box follows the URL** (`LookupPage.tsx` ~72): when `?search=` changes from outside
   (back/forward, link to the same route) update the input. Keep the existing debounce/no-loop behaviour.
7. **Double delete** (`LookupPage.tsx` ~113): guard with a `useRef` like `savingRef` in the form dialog.
8. **New item visible after add** (`LookupFormDialog.tsx` ~60): after a successful **create**, clear the
   search and go to page 1 with the default sort (`createdAt desc`) so the new row is at the top.
   Edits keep the current page/search.
9. **Focus after delete** (`Modal.tsx` ~119): if the element to restore focus to no longer exists,
   focus the "إضافة" button or the table instead of `<body>`.
10. **Breadcrumb labels in one place** (`Breadcrumbs.tsx` 9-13 and `LookupPage.tsx` 46): pick one way
    (a static route → label map is fine) so there's no flicker and no duplication.
11. **Typed resources** (`src/types/lookup.ts:2`): make `LookupResource` a union
    (`'agencies' | 'sectors'`) from a single list that also drives the `/data` hub links, so a new lookup
    is: add it to that list + add the route file.
12. **Sessions across tabs**: listen to the `storage` event so logging out (or in) in one tab updates
    the others. After login, return to the page the user originally asked for (e.g. `?returnTo=`),
    only allowing internal paths.
13. **User menu**: close it when focus leaves it (Tab) and on `Esc`.
14. **README**: what the app is, requirements, `.env.example` / `config.json`, `npm run dev`,
    `npm run build` (static export to `out/`), deploy on Vercel (`NEXT_PUBLIC_API_URL`), and the
    "how to add a new lookup page" steps.

## Out of scope

- Content Security Policy (will be done with the Tauri packaging).
- Any new pages or features.

## Done when

- `npm run build` (static export) and `npm run lint` pass with **0 errors and 0 warnings**.
- `npm audit` shows 0 critical / 0 high.
- Against the real backend: everything from task 002 still works, plus items 1, 6, 7, 8, 12 checked by hand.
- No English text visible in the UI.
- Final message: files changed/removed, dependency versions changed, decisions, anything not done or assumed.
