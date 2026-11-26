# Task 014 (Frontend): السلف — advance calculation sheet (حساب قيمة السلفة)

## Context

Read `README.md` and tasks 012–013 in `docs/tasks` (contracts advance, statements page and dialog). **Reuse** the list block,
counters, ComboboxField, DecimalField, DateField, ReadOnlyField/FormSection, print view, contract-info loading from the
statement dialog (generalize it into a shared "contract summary" piece instead of copying). The home card **سلفة + مستخلص**
now needs both pages: make it open a small hub page `/advances-statements/` with two cards — **السلف** (`/advances`) and
**المستخلصات** (`/statements`) — like the `/data` hub. Breadcrumbs accordingly.

## Backend API (backend task 013)

| Method | Route | Success |
|---|---|---|
| GET | `/api/advance-sheets?advanceStatus=&search=&page=&pageSize=20&sortBy=&sortDir=` | `PagedResult<Item> & { totalRequested; statusCounts: { all; statuses: { status; count }[] } }` |
| GET | `/api/advance-sheets/export?…` | `Item[]` (cap 5000 → 400 `errors.search`) |
| GET / POST / PUT / DELETE | `/api/advance-sheets[/{id}]` | |
| GET | `/api/advance-sheets/meta` | `{ prices: {value,label}[]; rates: { contractAdvanceCapRate: number; onSiteRate: number } }` |
| GET | `/api/contracts/{contractId}/advance-sheet` | sheet or 404 |
| GET | `/api/contracts/options`, `/api/contracts/{id}`, `/api/contracts/meta` (advance status labels) | |

Save body: `{ contractId, executionPercent, statementsSpent, advancesRemaining, ironPrice, cementPrice, ironQuantity,
cementQuantity, miscMaterialsValue, requestedAmount, siteReceiptDate, prices, executionDuration }`.
Item/detail: those inputs + contract summary (`contractNumber`, `contractName`, `projectName`, `companyName`,
`companyCommercialRegister`, `contractValue`, `advanceStatus`) + calculated `maxByContract`, `maxByProgress`, `maxOnSite`,
`lowestMax`, `materialsRemaining`, `totalSpent`, `totalSpentPercent`, `maxAllowedRequest`, `requestedPercent`,
`remainingInContract`, `remainingPercent`, `exceedsAllowed`. **Check the exact names/shapes against the backend DTOs.**
Errors: 400 per input key; 409 `contractId` ("توجد سلفة مسجلة لهذا العقد").

## The formulas (live preview in the form; the server values replace them after save)

`V` = contract value (from the chosen contract). Use the **rates from meta** (not hard-coded). Compute money in whole
piastres / percentages carefully (no float artifacts like "-0.00"; reuse the integer-thousandths approach from the deliveries
totals panel), round like the server (2 decimals, half away from zero):

maxByContract = V × capRate · maxByProgress = V × executionPercent/100 · maxOnSite = maxByProgress × onSiteRate ·
lowestMax = min(maxByContract, maxOnSite) · materialsRemaining = ironQty×ironPrice + cementQty×cementPrice + misc ·
totalSpent = statementsSpent + advancesRemaining + materialsRemaining · totalSpentPercent = totalSpent/V×100 ·
maxAllowedRequest = lowestMax − totalSpent · requestedPercent = requested/V×100 ·
remainingInContract = V − statementsSpent − requested · remainingPercent = remainingInContract/V×100.
V empty/0 → percentages and V-based limits show "—".

## Requirements

### 1. `/advances` page (title "السلف")

- Counter row **موقف السلفة** (from contracts meta advance statuses + "الكل", counts from `statusCounts`), search; URL-synced.
- Columns: رقم العقد · بيان العقد (clamped) · السلفة (requested amount) · موقف السلفة (badge) · الحد الاقصى المسموح ·
  نسبة اجمالي المنصرف · audit · الإجراءات. Rows where `exceedsAllowed` get a warning badge ("تتجاوز الحد المسموح").
- Summary: عدد السلف, إجمالي السلف (`totalRequested`). PDF/print with the shared view.

### 2. Add / edit dialog (xl, like the old layout: بيانات العقد | حساب قيمة السلفة (two columns) | بيانات عامة)

- **بيانات العقد:** رقم العقد Combobox (required on add, read-only on edit) + read-only contract info incl. **قيمة المشروع**.
  When adding, if the chosen contract already has a sheet (GET `/api/contracts/{id}/advance-sheet` = 200), show
  "توجد سلفة لهذا العقد" with a button to open it instead.
- **حساب قيمة السلفة:** inputs (white) and calculated values (read-only, grey) **in the old order**:
  الحد الاقصى لصرف دفعات تحت الحساب من العقد (calc) · نسبة التنفيذ (input %) · الحد الاقصى للصرف طبقا لنسبة التنفيذ (calc) ·
  الحد الاقصى لصرف المنفذ على الطبيعة (calc) · اقل حد مسموح به من الحد الاقصى (العقد − الطبيعة) (calc) ·
  المنصرف على العقد (مستخلصات) (input) · الباقي من السلف ولم يتم خصمه (input) · سعر الحديد · سعر الاسمنت · كمية الحديد ·
  كمية الاسمنت · قيمة الخامات المتنوعة (inputs) · الباقي من الخامات ولم يتم خصمه (calc) · اجمالي المنصرف (calc) ·
  نسبة اجمالي المنصرف (calc) · الحد الاقصى المسموح لطلب قيمة الدفعة تحت الحساب (calc) ·
  **قيمة الدفعة المطلوب صرفها تحت الحساب** (input = السلفة) · نسبتها (calc) · اجمالي القيمة المتبقية في التعاقد (calc) ·
  نسبتها (calc).
  - Next to **المنصرف على العقد (مستخلصات)**: a small button "من المستخلصات" that fills it with the contract's
    `statementsTotal` (from `/api/contracts/{id}`); still editable.
  - A visible (non-blocking) warning when the requested amount exceeds الحد الاقصى المسموح, or when the allowed max is negative.
- **بيانات عامة:** تاريخ استلام الموقع (DateField), الاسعار (select from meta: شاملة / غير شاملة, clearable), مدة التنفيذ (text 50).
- Money `dir="ltr"` with separators on blur, quantities 3 decimals, Arabic-Indic digits accepted. F2 / Esc / double-submit /
  server errors under fields / 409 under رقم العقد.

### 3. Wire-up

- Home **سلفة + مستخلص** → `/advances-statements/` hub (two cards). Contract dialog's السلفة section: a link
  "حساب قيمة السلفة" that opens `/advances?contractId=` … or opens the sheet dialog directly (pick the simpler, consistent one).

## Out of scope

The printed documents (اقرار / سلفة) — waiting for samples.

## Done when

- `npm run build` (static export) and `npm run lint`: 0 errors / 0 warnings; `npm audit` 0 high/critical.
- Against the backend: with the client's real case (V 214,006,500 · 20% · iron 21 × 2,121) the form shows exactly
  107,003,250.00 · 42,801,300.00 · 32,100,975.00 · 32,100,975.00 · 44,541.00 · 44,541.00 · 0.02% · 32,056,434.00 · 0.00% ·
  214,006,500.00 · 100.00%; saving updates the contract's قيمة السلفة / موقف السلفة; list, counters, print, Employee read-only.
- Everything else unchanged. No English text; RTL; light/dark.
- Branch `feature/advance-sheets` from `main`, small commits. Final message: files changed, reused/generalized pieces, assumptions.
