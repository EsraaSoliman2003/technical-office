# Task 013 (Frontend): Contracts phase 4 — المستخلصات (payment statements)

## Context

Read `README.md` and tasks 010–012 in `docs/tasks` (contracts list with counter rows, contract dialog with the papers section,
`/meta`, shared list block, ComboboxField, DateField, DecimalField, Textarea, shared attachments, print view). **Reuse** them.
`/statements` currently shows a teammate's UI draft: replace it and delete draft code only it uses (keep what quotations and
materials/deducted still use). The home card **سلفة + مستخلص** becomes active → `/statements`.

## Backend API (backend task 012)

| Method | Route | Success |
|---|---|---|
| GET | `/api/statements?contractId=&status=&installment=&search=&page=&pageSize=20&sortBy=&sortDir=` | `PagedResult<StatementItem> & { totalAmount; totalNetPayment; statusCounts: { all; statuses: { status; count }[] } }` |
| GET | `/api/statements/export?…` | `StatementItem[]` (cap 5000 → 400 `errors.search`) |
| GET | `/api/statements/meta` | `{ statuses: {value,label}[]; installments: {value,label}[] }` — use these labels |
| GET / POST / PUT / DELETE | `/api/statements[/{id}]` | |
| POST / GET / DELETE | `/api/statements/{id}/attachments[/{attachmentId}]` | max 10 |
| GET | `/api/contracts/{contractId}/statements` | `StatementItem[]` |
| GET | `/api/contracts/options` | `[{ id, name }]` (name = "رقم العقد — اسم العقد") |

```ts
type StatementItem = {
  id: string; contractId: string;
  contractNumber: string; contractName: string; projectName: string; companyName: string;
  companyCommercialRegister: string | null; contractValue: number | null;
  amount: number; executionPercent: number | null; paymentPercent: number | null; // calculated
  installment: string | null; officerRank: string | null; officerName: string | null;
  battalionDate: string | null; brigadeDate: string | null; managementDate: string | null;
  authorityDate: string | null; centralDate: string | null; paymentDate: string | null; // yyyy-MM-dd
  netPayment: number | null; ironValue: number | null; cementValue: number | null; materialsTotal: number | null; // calculated
  insuranceStatus: string | null; centralLetter: string | null; coding: string | null; notes: string | null;
  status: string; // calculated: never sent
  attachmentCount: number;
  createdAt: string; createdByName: string | null; updatedAt: string | null; updatedByName: string | null;
};
```
Contracts page gains `statementCounts: { statuses: { status: string; count: number }[] }` and the filter
`statementStatus=<name>`; contract items gain `statementCount` and `statementsTotal`.

## Requirements

### 1. Statement dialog (shared by both entry points)

- **بيانات العقد:** رقم العقد (Combobox from `/api/contracts/options`, required; fixed/read-only when opened from a contract), then
  read-only: بيان العقد, اسم المشروع, اسم الشركة طبقا للموافقة الامنية, السجل التجاري, القيمة التعاقدية (from the chosen contract:
  fetch `/api/contracts/{id}` when it changes).
- **حساب قيمة المستخلص:** قيمة المستخلص (required, > 0, money), نسبة التنفيذ % (0–100), **النسبة المؤوية للصرف** read-only
  (live preview = amount / contract value × 100, "—" without a value; the server value after save), دفعة (select from meta, clearable),
  الرتبة, الضابط.
- **مسار المستخلص:** تاريخ الكتيبة · تاريخ اللواء · تاريخ الادارة · تاريخ الهيئة · ادارة مركزية · تاريخ الصرف (clearable dates) and
  **موقف المستخلص** read-only (badge; "يُحسب بعد الحفظ" for new).
- **الخصومات والصرف:** الحديد, الاسمنت, **اجمالي الخامات** read-only (live sum), صافي الصرف.
- **أخرى:** موقف التامينات, جواب مركزية, التكويد, ملاحظات (Textarea 2000), المرفقات (shared, max 10).
- F2 / Esc / double-submit / save-then-upload + retry / server errors under fields — as before. Nested-dialog safe (it opens on top
  of the contract dialog in §3).

### 2. `/statements` page (title "المستخلصات")

- Counter row **موقف المستخلص** (from meta statuses + "الكل", counts from `statusCounts`), filters: رقم العقد (Combobox),
  دفعة (select), بحث شامل — URL-synced like the other pages.
- Columns: رقم العقد · بيان العقد (clamped) · قيمة المستخلص · صافي الصرف · موقف المستخلص (badge, sortable) · دفعة · تاريخ الصرف ·
  النسبة المؤوية للصرف · المرفقات · audit · الإجراءات. Money `dir="ltr"` with separators.
- Summary: عدد المستخلصات, إجمالي قيمة المستخلصات, إجمالي صافي الصرف. PDF/print with the shared view.

### 3. Contract dialog: section **"المستخلصات المستلمة خاصة بالمشروع"** (edit mode, like الأوراق المستلمة)

- Compact table from `/api/contracts/{id}/statements`: قيمة المستخلص · صافي الصرف · موقف المستخلص · دفعة · تاريخ الصرف ·
  اجمالي الخامات · المرفقات · تعديل/حذف. "إضافة مستخلص" opens the statement dialog with the contract fixed.
  Disabled while the contract saves (like papers). Create mode: "احفظ العقد أولاً لإضافة المستخلصات".

### 4. Contracts list: third counter row **"موقف المستخلص"**

- Under the السلفة row: **معلق · كتيبة · لواء · ادارة · هيئة · مركزية** (from statements meta, these six) with counts from
  `statementCounts`; clicking sets `?statementStatus=` (click again → clear); page resets; unknown values dropped after meta loads.
- New column **المستخلصات**: `statementCount` and `statementsTotal`.

## To confirm with the client (from the backend task)

The status table; more دفعة values; whether صافي الصرف is calculated; النسبة المؤوية للصرف per statement vs cumulative;
موقف التامينات values. Build so each is a small change.

## Done when

- `npm run build` (static export) and `npm run lint`: 0 errors / 0 warnings; `npm audit` 0 high/critical.
- Against the backend: create/edit/delete statements from both places; contract info fills in; live percent and materials total;
  status updates after save; counters/filters/totals/print on /statements; the contracts list's third counter row and column;
  Employee read-only.
- Everything else unchanged. No English text; RTL; light/dark.
- Branch `feature/statements` from `main`, small commits. Final message: files changed/removed, reused pieces, assumptions.
