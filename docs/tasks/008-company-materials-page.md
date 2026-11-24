# Task 008 (Frontend): خامات الشركات (Company materials) page

## Context

Arabic-only RTL app, static export, RTK Query. Read `README.md` and tasks 004 (Companies) and 007 (Projects) in
`docs/tasks`: **reuse** the list building block (URL filters + toolbar), the `Combobox`, the shared attachment components
and the save-then-upload flow. `/data/company-materials` currently shows a teammate's UI draft
(`src/features/company-materials/*`): replace it and delete the draft code only it uses (keep anything still used by the
خامات المشاريع draft at `/data/project-materials`, which stays untouched).

**Client decision:** project, material and company are always **chosen from existing records** (dropdowns), never typed.

## Backend API (backend task 007)

| Method | Route | Success |
|---|---|---|
| GET | `/api/company-materials?projectId=&materialId=&companyId=&search=&page=&pageSize=20&sortBy=&sortDir=` | `PagedResult<Item> & { totalQuantity: number }` |
| GET | `/api/company-materials/export?…same filters, no paging…` | `Item[]` (max 5000, else 400) |
| GET | `/api/company-materials/{id}` | `Item & { attachments: AttachmentDto[] }` |
| POST / PUT | `/api/company-materials` / `/{id}` | body `{ loadingPermitNumber, projectId, materialId, companyId, quantity, receivingEngineer, notes }` |
| DELETE | `/api/company-materials/{id}` | 204 |
| POST / GET / DELETE | `/api/company-materials/{id}/attachments[/{attachmentId}]` | multipart `files` (max 5) / file / 204 |
| GET | `/api/projects/options`, `/api/materials/options`, `/api/companies/options` | `[{ id, name }]` |

```ts
type CompanyMaterialItem = {
  id: string; loadingPermitNumber: string | null;
  projectId: string; projectName: string; materialId: string; materialName: string;
  companyId: string; companyName: string; quantity: number;
  receivingEngineer: string | null; notes: string | null; attachmentCount: number;
  createdAt: string; createdByName: string | null; updatedAt: string | null; updatedByName: string | null;
};
```

Errors: 400 keys `loadingPermitNumber`, `projectId`, `materialId`, `companyId`, `quantity`, `receivingEngineer`, `notes`,
`files`; 409 on deleting a project/material/company that is in use (show the Arabic message as a toast on those pages —
check the existing delete flow shows server 409 messages).

## Requirements

### 1. List (`/data/company-materials`)

- Toolbar filters (URL-synced, reset page): **اسم المشروع** (Combobox from `/api/projects/options`, clearable),
  **الخامة** (Combobox from `/api/materials/options`, clearable), **الشركة المنفذة** (Combobox, clearable), plus the normal
  search box ("بحث شامل"). Unknown ids in the URL are dropped like `?status=` on Projects.
- Columns (RTL order): رقم اذن التحميل · اسم المشروع · الخامة · الشركة المنفذة · الكمية · المهندس المستلم · ملاحظات ·
  البوليصة · مدخل البيانات · توقيت الإضافة · آخر تعديل · توقيت التعديل · الإجراءات.
  - الكمية: Latin digits, up to 3 decimals, `dir="ltr"`. Permit number `dir="ltr"`, `—` if empty.
  - ملاحظات: clamp to 2 lines with the full text in a tooltip/popover (the old screen cut long notes off).
  - البوليصة: paperclip button with count → attachments viewer (reuse), `—` if none.
- Under the table: **إجمالي الكمية** = `totalQuantity` for the current filters (with the material name when a material filter
  is set, e.g. "إجمالي الكمية (حديد): 92.300").
- Sortable: رقم اذن التحميل, اسم المشروع, الخامة, الشركة المنفذة, الكمية, توقيت الإضافة, توقيت التعديل.

### 2. PDF button (طباعة / PDF)

- Calls `/export` with the current filters and sort, then opens a **print view** (a dedicated print layout: title
  "خامات الشركات", the active filters, print date, a table with the business columns — no actions/audit columns — and the
  total quantity), then `window.print()` so the user can "Save as PDF". Arabic must render correctly (it's the browser).
- Use `@media print` styles (A4 landscape, repeat table header on each page, no app chrome). Must work in the static export
  and later in Tauri (no new tab with a direct API URL; build the print DOM in the app).
- 400 "too many rows" → Arabic toast telling the user to narrow the filters.

### 3. Add / edit dialog

- رقم اذن التحميل (optional, max 50, `dir="ltr"`, Arabic-Indic digits accepted).
- اسم المشروع, الخامة, الشركة المنفذة — required Comboboxes from the options endpoints (type-to-filter in Arabic).
- الكمية (required, > 0, up to 3 decimals, Arabic-Indic digits accepted, `dir="ltr"`).
- المهندس المستلم (optional, max 200). ملاحظات (optional textarea, max 2000, with a character counter).
- البوليصة: shared attachment section (max 5 files) with the save-then-upload flow and retry.
- When the list has a project/material/company filter active, pre-fill those fields when adding.
- F2 / Enter (not inside the textarea) / Esc, double-submit protection, server errors under fields.

### 4. Wire-up

- `/data` hub: خامات الشركات becomes an active card (no "مسودة"). Breadcrumb label stays.

## Done when

- `npm run build` (static export) and `npm run lint`: 0 errors / 0 warnings; `npm audit` 0 high/critical.
- Against the backend: filters (each and combined, URL refresh), search, sort, paging, total quantity, PDF print view with
  Arabic text and totals, create/edit/delete with files, Employee read-only.
- Other pages unchanged. No English text; RTL; light/dark (print view always light).
- Branch `feature/company-materials` from `main`, small commits. Final message: files changed/removed, reused pieces,
  assumptions.
