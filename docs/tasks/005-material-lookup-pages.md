# Task 005 (Frontend): الخامات، المصانع، الخلاطات، شركات النقل pages

## Context

Four more name-only master-data lists, identical in behaviour to الجهات / القطاعات. Read README
"how to add a lookup page" — this should be **configuration only**: add entries to `LOOKUPS`
(`src/lib/lookups.ts`) + route files using `LookupPage`. No new components.

The backend (task 004 in the backend repo) serves them with the same API shape as `/api/agencies`:

| Resource | Title (list) | Field label | Route |
|---|---|---|---|
| `materials` | الخامات | الخامة | `/data/materials` |
| `factories` | المصانع | المصنع | `/data/factories` |
| `mixers` | الخلاطات | الخلاطة | `/data/mixers` |
| `transport-companies` | شركات النقل | شركة النقل | `/data/transport-companies` |

## Requirements

1. Add the four lookups to `LOOKUPS` and create their route files with `LookupPage`.
2. These routes currently show a teammate's **UI drafts** (local state only). Replace them, and delete the draft
   code that only they use (`src/features/materials/*` and the drafts behind `/data/factories`, `/data/mixers`,
   `/data/transport-companies` — check what each route imports). Do **not** touch drafts still in use by other
   routes (خامات الشركات, خامات المشاريع, المشاريع, انواع المشاريع, تقرير العقود, contracts, statements, quotations,
   materials/deducted). If a shared draft component becomes unused, delete it; if it's still used, keep it.
3. `/data` hub: the four cards become normal active lookup cards (no "مسودة"). Fix the label of the mixers card:
   it must be **الخلاطات** (today it says الخلطات). Breadcrumb labels come from `LOOKUPS`; remove the duplicated
   draft labels for these four from `Breadcrumbs.tsx`.
4. Everything else (search, sort, paging, add/edit with F2, delete, Employee read-only) comes from `LookupPage`
   unchanged.

## Done when

- `npm run build` (static export) and `npm run lint` pass with 0 errors / 0 warnings; `npm audit` 0 high/critical.
- All six lookup pages work against the backend; the other drafts still open.
- No English text visible; RTL; light and dark mode.
- Branch `feature/material-lookups` from `main`, small commits. Final message: files changed/removed,
  which draft files were deleted and why, anything assumed.
