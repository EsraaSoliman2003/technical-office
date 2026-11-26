# Task 015 (Frontend): التمام اليومي (daily summary dashboard)

## Context

Arabic-only RTL app, static export, RTK Query. Read `README.md` and tasks 010–014 in `docs/tasks`. **No backend change is
needed**: the contracts list endpoint already returns every counter this page shows, for the current filters:

```
GET /api/contracts?projectId=<optional>&page=1&pageSize=1
→ { statusCounts: { all, statuses: [{ status, count }] },          // موقف العقد
    advanceCounts: { statuses: [{ status, count }], pendingPapers }, // موقف السلفة + الأوراق المعلقة
    statementCounts: { statuses: [{ status, count }] }, … }          // موقف المستخلص (number of statements)
GET /api/contracts/meta    → statuses, advanceStatuses (labels + order)
GET /api/statements/meta   → statuses (labels + order)
GET /api/projects/options  → [{ id, name }]
```
Reuse the existing RTK endpoints/types (don't add a second copy of these shapes) and the counter helpers
(`isStatementCounterStatus`, `ADVANCE_COUNTER_STATUSES`, …) from the contracts page.

## Old screen

Title **التمام اليومي**, a filter **اسم المشروع** (dropdown + search + clear), then four framed sections of counter buttons, each
button with its count underneath; buttons are **green when the count is 0** and **yellow/amber when > 0** (needs attention):
- **موقف العقد:** الكل · ادارة · هيئة · استيفاء · نسب تجاوز · كارت · كراسات · جاري التعاقد (e.g. 1293 · 8 · 26 · 0 · 12 · 5 · 16 · 129).
- **موقف السلفة:** لواء · ادارة · هيئة · مركزية · الأوراق المعلقة.
- **موقف المستخلص:** الكل · كتيبة · لواء · ادارة · هيئة · مركزية (e.g. 1104 · 24 · 49 · 126 · 9 · 13).
- **موقف الجوابات:** الكل · متابعة · بدون متابعة (letters — **not built yet**).
Choosing a project recalculates every section for that project.

## Requirements

### 1. Page `/daily-summary` (title "التمام اليومي")

- **Project filter:** Combobox from `/api/projects/options`, clearable, URL-synced (`?projectId=`), unknown ids dropped after the
  options load (same behaviour as the other pages). One request to `/api/contracts?projectId=…&pageSize=1` feeds all sections.
- **Sections** (cards with a title, responsive grid of tiles; each tile = label + big count):
  1. **موقف العقد:** "الكل" (`statusCounts.all`) + every status from `contracts meta.statuses` in their order (show all, so new
     statuses appear automatically).
  2. **موقف السلفة:** the four counter statuses (لواء · ادارة · هيئة · مركزية, same selection as the contracts page) +
     **الأوراق المعلقة** (`advanceCounts.pendingPapers`).
  3. **موقف المستخلص:** "الكل" (= sum of all `statementCounts.statuses`, i.e. every statement incl. معلق and تم الصرف) + the
     statement statuses **كتيبة · لواء · ادارة · هيئة · مركزية** (labels and order from statements meta).
  4. **موقف الجوابات:** the three tiles الكل · متابعة · بدون متابعة shown disabled with a "قريبًا" badge (the letters feature
     comes later; keep the section so it plugs in then).
- **Colours:** count 0 → success/green tone; count > 0 → accent/amber tone (like the old screen); "الكل" tiles neutral. Use
  theme tokens (light/dark); not colour-only — the number is always visible.
- **Clicking a tile opens the matching filtered list** (keeping the project): موقف العقد → `/contracts/?status=…&projectId=…`
  ("الكل" → no status); السلفة → `/contracts/?advanceStatus=…` or `?hasPendingPapers=true`; المستخلص →
  `/contracts/?statementStatus=…` ("الكل" → `/statements/`). Tiles are real links (keyboard + middle-click friendly).
- States: skeleton tiles while loading; an error state with "إعادة المحاولة"; a small "آخر تحديث: HH:mm" with a refresh button;
  refetch on window focus.
- Print: a compact printable version (title, project, date, the four sections as tables) via the shared print view if it fits,
  otherwise `@media print` styles for this page.

### 2. Wire-up

- Home card **التمام اليومي** becomes active → `/daily-summary/`. Breadcrumb "التمام اليومي".

## Done when

- `npm run build` (static export) and `npm run lint`: 0 errors / 0 warnings; `npm audit` 0 high/critical.
- Against the backend: counts match the contracts page counters for all projects and for one project; tiles link to the right
  filtered lists; colours follow 0 / > 0; letters section shows "قريبًا"; works in light/dark and on mobile.
- Everything else unchanged. No English text; RTL.
- Branch `feature/daily-summary` from `main`, small commits. Final message: files changed, reused pieces, assumptions.
