# Task 009 (Frontend): خامات المشاريع (material deliveries) page

## Context

Arabic-only RTL app, static export, RTK Query. Read `README.md` and task 008 (خامات الشركات) in `docs/tasks`: this page is
the same kind — **reuse** its pieces (list block with URL filters waiting for options, `Combobox`, `Textarea`, shared decimal
and quantity helpers, shared attachments with save-then-upload, export + in-app A4 print view, total quantity). Don't copy;
generalize where something is company-materials-specific (e.g. the print view should take title, filters and columns as props).

`/data/project-materials` still shows the teammate's UI draft (`src/features/project-materials/*`): replace it and delete
the draft code. After this, if `ImageUploadField`, `types/UploadedFile` or other draft-only helpers are unused, delete them too.

Each record is **one delivery** (one bill of lading / truck) of a material to a project.

## Backend API (backend task 008)

| Method | Route | Success |
|---|---|---|
| GET | `/api/material-deliveries?authorizationNumber=&projectId=&materialId=&billOfLadingNumber=&search=&page=&pageSize=20&sortBy=&sortDir=` | `PagedResult<Item> & { totalQuantity }` |
| GET | `/api/material-deliveries/export?…same filters…` | `Item[]` (cap 5000 → 400 with `errors.search`) |
| GET | `/api/material-deliveries/totals?projectId=&materialId=&excludeId=` | `{ approved: number \| null, dispensed: number }` |
| GET / POST / PUT / DELETE | `/api/material-deliveries[/{id}]` | item / save / 204 |
| POST / GET / DELETE | `/api/material-deliveries/{id}/attachments[/{attachmentId}]` | multipart `files` (max 5) / file / 204 |
| GET | `/api/{project-types,projects,materials,factories,mixers,transport-companies}/options` | `[{ id, name }]` |

```ts
type MaterialDeliveryItem = {
  id: string;
  authorizationNumber: string | null; billOfLadingNumber: string | null; billDate: string | null; // yyyy-MM-dd
  projectTypeId: string | null; projectTypeName: string | null;
  projectId: string; projectName: string; materialId: string; materialName: string;
  quantity: number;
  loadingPermitNumber: string | null; salesOrderNumber: string | null; vehicleNumber: string | null; driverName: string | null;
  factoryId: string | null; factoryName: string | null; mixerId: string | null; mixerName: string | null;
  transportCompanyId: string | null; transportCompanyName: string | null;
  receivedDate: string | null; exitDate: string | null; notes: string | null; attachmentCount: number;
  createdAt: string; createdByName: string | null; updatedAt: string | null; updatedByName: string | null;
};
```

Errors: 400 keys = the field names above (camelCase, `…Id` for dropdowns), `files`; 409 `billOfLadingNumber`
("رقم البوليصة مسجل من قبل").

## Requirements

### 1. List (`/data/project-materials`, title "خامات المشاريع")

- Toolbar (URL-synced): **رقم التفويض** (text, exact), **اسم المشروع** (Combobox), **الخامة** (Combobox), **رقم البوليصة**
  (text, exact), **بحث شامل**. Text filters apply on Enter / after debounce like search. Same option-loading behaviour as خامات الشركات.
- Columns: رقم التفويض · رقم البوليصة · تاريخ البوليصة · اسم المشروع · الخامة · الكمية · رقم السيارة · المصنع · ملاحظات ·
  البوليصة (attachments) · مدخل البيانات · توقيت الإضافة · آخر تعديل · توقيت التعديل · الإجراءات.
  Numbers/dates `dir="ltr"`, dates `yyyy/MM/dd` without timezone shift, notes clamped with full text available.
- **إجمالي الكمية** under the table (with the material name when filtered), like خامات الشركات.
- **PDF / طباعة**: same in-app print flow; title "خامات المشاريع", active filters, business columns, total.

### 2. Add / edit dialog (two columns on desktop, one on mobile; scrolls inside)

- Right column: رقم التفويض · نوع المشروع (Combobox, optional) · المشروع (Combobox, required) · رقم البوليصة · تاريخ البوليصة ·
  الكمية (required, > 0, ≤ 3 decimals) · الخامة (Combobox, required) · اذن التحميل · رقم امر البيع · رقم السيارة · اسم السائق ·
  المصنع (Combobox, optional).
- Left column: الخلاطة (Combobox) · شركة النقل (Combobox) · تاريخ الاستلام · تاريخ الخروج · ملاحظات (Textarea, 2000) ·
  البوليصة (shared attachments, max 5).
- Number fields (`رقم …`, `اذن التحميل`) `dir="ltr"`, Arabic-Indic digits accepted. Dates: date inputs, clearable, `yyyy-MM-dd`.
- **Totals panel** (read-only, like the old boxes), shown when project **and** material are chosen:
  - **اجمالي التصديق** = `approved` (or "غير محدد في المشروع" when null),
  - **اجمالي المنصرف** = `dispensed` (from `/totals` with `excludeId` = this record when editing) **+ the quantity being typed**,
  - **المتبقي** = approved − dispensed (when approved exists),
  - a visible Arabic **warning** (not blocking) when dispensed exceeds approved: "الكمية المنصرفة تتجاوز الكمية المصدّق عليها".
  Refetch totals when project or material changes; debounce; numbers with 3 decimals.
- Pre-fill المشروع / الخامة from active list filters when adding.
- F2 / Esc / double-submit / save-then-upload + retry / server errors under fields, as before.

### 3. Wire-up

- `/data` hub: خامات المشاريع becomes an active card (no "مسودة"); breadcrumb label stays.

## Done when

- `npm run build` (static export) and `npm run lint`: 0 errors / 0 warnings; `npm audit` 0 high/critical.
- Against the backend: all filters (URL refresh), search, sort, paging, total, print view, create/edit/delete with files,
  totals panel incl. warning and edit mode, bill-number 409 under the field, Employee read-only.
- خامات الشركات and every other page unchanged. No English text; RTL; light/dark (print always light).
- Branch `feature/material-deliveries` from `main`, small commits. Final message: files changed/removed, what was generalized,
  assumptions.
