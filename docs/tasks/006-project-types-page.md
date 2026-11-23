# Task 006 (Frontend): انواع المشاريع page

## Context

One more name-only lookup, identical in behaviour to the other six. Configuration only (README "how to add a
lookup page"): add it to `LOOKUPS` + a route file using `LookupPage`. The backend serves `/api/project-types`
with the same API shape as `/api/agencies`.

| Resource | Title (list) | Field label | Route |
|---|---|---|---|
| `project-types` | انواع المشاريع | نوع المشروع | `/data/project-types` |

## Requirements

1. Add the lookup to `LOOKUPS` and serve `/data/project-types` with `LookupPage`.
2. The route currently shows a teammate's UI draft (`src/features/project-types/*`, local state only). Replace it
   and delete the draft code that only it uses. Don't touch the other drafts (المشاريع, خامات الشركات,
   خامات المشاريع, تقرير العقود, contracts, statements, quotations, materials/deducted).
3. `/data` hub: the انواع المشاريع card becomes a normal active lookup card (no "مسودة"); its breadcrumb label
   comes from `LOOKUPS` (remove the duplicated draft label in `Breadcrumbs.tsx`).

## Done when

- `npm run build` (static export) and `npm run lint` pass with 0 errors / 0 warnings; `npm audit` 0 high/critical.
- The page works against the backend; the other drafts still open. No English text; RTL; light/dark.
- Branch `feature/project-types` from `main`, small commits. Final message: files changed/removed, anything assumed.
