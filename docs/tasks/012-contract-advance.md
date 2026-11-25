# Task 012 (Frontend): Contracts phase 3 — السلفة (advance payment)

## Context

Read `README.md` and tasks 010 (contract core: counters, `/meta`, form) and 011 (contract papers). This phase adds the
**السلفة** section to the contract form and the **السلفة counters row** to the contracts list. Reuse the existing pieces
(SegmentedFilter counters, DateField, DecimalField/money fields, Badge, print view). Don't copy.

## Backend API changes (backend task 011)

- Contract item / detail / export gain: `advanceValue: number | null`, `advanceBrigadeDate`, `advanceManagementDate`,
  `advanceAuthorityDate`, `advanceCentralDate`, `advancePaymentDate` (`yyyy-MM-dd | null`), and
  `advanceStatus` (calculated by the server, **never sent**).
- Save request gains the 6 editable fields (not `advanceStatus`).
- `/api/contracts/meta` gains `advanceStatuses: { value, label }[]` in journey order
  (`None` لا توجد سلفة, `NotSubmitted` لم تُسلَّم, `Brigade` لواء, `Management` ادارة, `Authority` هيئة, `Central` مركزية,
  `Paid` تم الصرف) — use the labels from meta, don't hard-code.
- New filters: `advanceStatus=<name>` and `hasPendingPapers=true`.
- The page gains `advanceCounts: { statuses: { status: string; count: number }[]; pendingPapers: number }` and
  `totalAdvanceValue: number`. (Same style as `statusCounts`: map `statuses` by status, missing → 0.)
- `sortBy` gains `advanceStatus`, `advanceValue`, `advancePaymentDate`.

## Requirements

### 1. Contracts list

- A **second counter row "السلفة"** under the موقف العقد row (like the old screen): buttons **لواء · ادارة · هيئة · مركزية**
  (from `meta.advanceStatuses`, these four only — matching the old screen) with their counts, plus **الأوراق المعلقة** with
  `advanceCounts.pendingPapers`. Clicking a status sets `?advanceStatus=` (click again → clear); الأوراق المعلقة sets
  `?hasPendingPapers=true`. The two are independent of the موقف العقد row and of each other (a status click clears
  hasPendingPapers and vice versa, so the row behaves like one choice). Active button highlighted; page resets.
- New columns: **موقف السلفة** (badge, sortable) and **قيمة السلفة** (money, sortable).
- Summary: add **إجمالي السلف** (`totalAdvanceValue`) next to the existing totals.
- Print view: the advance filter label (if any) in the filters, and the two new columns.
- Unknown `?advanceStatus=` dropped after meta loads (like `?status=`).

### 2. Contract form — section **السلفة**

- قيمة السلفة (money, optional, ≥ 0, 2 decimals, Arabic-Indic digits, separators on blur, `dir="ltr"`), then the 5 dates in
  order: تسليم اللواء · تسليم الادارة · تسليم الهيئة · الادارة المركزية · تاريخ الصرف (clearable `DateField`s).
- **موقف السلفة** shown **read-only** (badge) like موقف العقد: the saved value; after save the server's new value; on a new
  contract "يُحسب بعد الحفظ".
- Layout like the old form: its own column/section next to القيم on desktop, stacked on mobile.

## Done when

- `npm run build` (static export) and `npm run lint`: 0 errors / 0 warnings; `npm audit` 0 high/critical.
- Against the backend: advance fields save and reload; موقف السلفة updates after save; the السلفة counters show counts and
  filter (incl. الأوراق المعلقة); totals; sorting; print; Employee read-only.
- Everything else unchanged (the موقف العقد counters still work). No English text; RTL; light/dark.
- Branch `feature/contract-advance` from `main`, small commits. Final message: files changed, reused pieces, assumptions.
