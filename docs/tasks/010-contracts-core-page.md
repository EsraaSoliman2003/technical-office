# Task 010 (Frontend): العقود (Contracts) — phase 1: contract core

## Context

Arabic-only RTL app, static export, RTK Query. Read `README.md` and tasks 007–009 in `docs/tasks`: **reuse** the list block
(URL filters, toolbar, summary, header actions), `ComboboxField`, `DateField`, quantity/decimal fields, `Textarea`, the xl `Modal`,
shared attachments (per category, save-then-upload, retry, viewer) and the in-app print view. Generalize instead of copying.

Contracts is split into 4 phases; **this is phase 1 only**. `/contracts` currently shows a teammate's UI draft
(`src/app/(all)/contracts`, local state): replace it and delete draft code only it uses (keep what statements, quotations and
materials/deducted drafts still use). The home card **العقود** becomes a normal active card (no "مسودة").

## Backend API (backend task 009)

| Method | Route | Success |
|---|---|---|
| GET | `/api/contracts?contractNumber=&projectId=&companyId=&status=&stage=&search=&page=&pageSize=20&sortBy=&sortDir=` | `PagedResult<Item> & { totalValue: number; statusCounts: Record<Status \| "all", number> }` |
| GET | `/api/contracts/export?…` | `Item[]` (cap 5000 → 400 `errors.search`) |
| GET | `/api/contracts/meta` | `{ stages: {value,label}[]; statuses: {value,label}[] }` — **use these labels/order, don't hard-code** |
| GET / POST / PUT / DELETE | `/api/contracts[/{id}]` | |
| POST / GET / DELETE | `/api/contracts/{id}/attachments?category=consultantReview\|approvedQuantities\|irSubmittal`, `/{attachmentId}` | |
| GET | `/api/{project-types,projects,companies}/options` | |

Item fields: `contractNumber, name, projectTypeId/Name, projectId/Name, companyId/Name, status, stage, notes,
boqSubmissionDate, supplySubmissionDate, authoritySubmissionDate, authorityReturnDate, authorityReturnForCompletionDate,
returnReason, cardPrintDate, bookletsDeliveryDate, fundingDate, contractDate, battalionValue, managementValue, authorityValue,
discountValue, overrunValue, overrunPercent, ironRate, cementRate, contractValue, attachmentCounts{consultantReview,
approvedQuantities, irSubmittal}`, audit fields. `status` (موقف العقد) is **calculated by the server** from the dates — never sent.
Errors: 400 per field key, 409 `contractNumber` ("رقم العقد مسجل من قبل").

## Requirements

### 1. List (`/contracts`, title "العقود")

- **Status counters** (the old row of buttons): one button per status from `meta.statuses` (+ "الكل") showing
  `statusCounts`; clicking filters by that status (URL `?status=`), the active one highlighted. Counts update with the other filters.
- Toolbar filters (URL-synced): رقم العقد (exact text filter), اسم المشروع (Combobox), اسم الشركة (Combobox), مرحلة العقد (select
  from `meta.stages`), بحث شامل.
- Columns: رقم العقد · اسم العقد (2-line clamp, full text available) · اسم المشروع · اسم الشركة · قيمة العقد · موقف العقد (badge)
  · مرحلة العقد · تاريخ التعاقد · المرفقات · ملاحظات · audit · الإجراءات. Money with thousands separators, `dir="ltr"`.
- Summary under the table: **عدد العقود** (total count) and **إجمالي قيمة العقود** (`totalValue`).
- **PDF / طباعة** with the shared print view: title "العقود", active filters (incl. status), business columns, count and total.

### 2. Add / edit (xl Modal, scrolls inside; sections like the old form)

- **بيانات العقد:** رقم العقد (required, `dir="ltr"`, Arabic-Indic digits), اسم العقد (required, textarea-like, 500), نوع المشروع
  (Combobox, optional), اسم المشروع (Combobox, required), الشركة المنفذة (Combobox, required), مرحلة العقد (select from meta,
  clearable), **موقف العقد shown read-only** (badge; in edit mode the saved value, and after save the server's new value), ملاحظات.
- **التواريخ:** the 10 dates in journey order (clearable `DateField`s) + سبب الرجوع (استيفاء) (textarea, 1000) next to the
  استيفاء date. Optional: a small hint showing which status the filled dates will give (computed client-side **only as a hint**;
  the server value is authoritative).
- **القيم:** قيمة الكتيبة, قيمة الادارة, قيمة الهيئة, قيمة التخفيض, قيمة التجاوز, نسبة التجاوز %, فئة الحديد, فئة الاسمنت
  (≥ 0, 2 decimals, Arabic-Indic digits, thousands separators on blur, `dir="ltr"`), and a read-only **قيمة العقد** preview
  (= الهيئة ?? الادارة ?? الكتيبة).
- **المرفقات:** three sections — مراجعة استشاري, الحصر المعتمد, IR + Submittal — with the shared attachment UX (max 10 each).
- Pre-fill المشروع / الشركة from active filters when adding. F2 / Esc / double-submit / server errors under fields / retry, as before.
- Layout: two or three columns on desktop like the old screen, one column on mobile.

### 3. Wire-up

- Home: العقود card active → `/contracts`. Breadcrumb "العقود".

## Out of scope (later phases)

الأوراق المستلمة, السلفة (+ its counters), المستخلصات (+ its counters), Excel export.

## Done when

- `npm run build` (static export) and `npm run lint`: 0 errors / 0 warnings; `npm audit` 0 high/critical.
- Against the backend: counters + status filter, all filters (URL refresh), search, sort, paging, totals, print, create/edit/delete
  with all field types and files, status shown read-only and updated after save, 409 contract number, Employee read-only.
- Every other page unchanged. No English text except "IR + Submittal" / "PDF" / "F2"; RTL; light/dark (print always light).
- Branch `feature/contracts-core` from `main`, small commits. Final message: files changed/removed, generalized pieces, assumptions.
