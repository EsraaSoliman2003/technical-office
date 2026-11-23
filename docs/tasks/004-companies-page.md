# Task 004 (Frontend): الشركات (Companies) page with attachments

## Context

Arabic-only RTL app, static export (`output: 'export'`) for a future Tauri build, client-side data via
RTK Query on the shared axios instance (runtime `config.json` API URL, Bearer token, ProblemDetails errors).
Read `README.md` and tasks 001–003 in `docs/tasks` first.

`/data/companies` currently shows a **UI draft** by a teammate (`src/features/companies/*`, local state only,
"مسودة" badge on the `/data` hub). This task replaces it with a real, API-backed page. Use the draft as
inspiration for layout if useful, then **delete the draft files** (`src/features/companies/*`) and anything only
they use. Leave the other drafts untouched.

## Backend API (implemented in the backend repo, task 003)

All require the Bearer token. Write actions need role `Admin` or `Manager` (else 403).

| Method | Route | Body | Success |
|---|---|---|---|
| GET | `/api/companies?search=&page=1&pageSize=20&sortBy=createdAt&sortDir=desc` | — | 200 `PagedResult<CompanyListItemDto>` |
| GET | `/api/companies/{id}` | — | 200 `CompanyDto` |
| POST | `/api/companies` | `{ name, commercialRegister?, mobile? }` | 201 `CompanyDto` |
| PUT | `/api/companies/{id}` | same | 200 `CompanyDto` |
| DELETE | `/api/companies/{id}` | — | 204 |
| POST | `/api/companies/{id}/attachments` | `multipart/form-data`, field `files` (1..n) | 201 `AttachmentDto[]` |
| GET | `/api/companies/{id}/attachments/{attachmentId}` | — | 200 file (PDF/image) |
| DELETE | `/api/companies/{id}/attachments/{attachmentId}` | — | 204 |

```ts
type CompanyListItemDto = {
  id: string; name: string; commercialRegister: string | null; mobile: string | null;
  attachmentCount: number;
  createdAt: string; createdByName: string | null; updatedAt: string | null; updatedByName: string | null;
};
type AttachmentDto = { id: string; fileName: string; contentType: string; sizeBytes: number; createdAt: string; createdByName: string | null };
type CompanyDto = Omit<CompanyListItemDto, "attachmentCount"> & { attachments: AttachmentDto[] };
```

- Search matches name, commercial register or mobile. Sort by `name` | `createdAt` | `updatedAt`.
- Errors: 400 `errors.name|commercialRegister|mobile|files`, 409 `errors.name` ("هذا الاسم مسجل من قبل") or
  `errors.commercialRegister` ("السجل التجاري مسجل لشركة أخرى").
- Uploads: PDF, JPEG, PNG, WEBP only; max 10 MB per file; max 10 attachments per company.

## Old screen (what users are used to)

Columns: `مرفق` (eye icon) · `تعديل` · `حذف` · **الشركة** · **السجل التجاري** · **الموبايل** · `مدخل البيانات` ·
`توقيت الإضافة` · `اخر تعديل` · `توقيت التعديل`. Search, "اضافة +", dialog with الشركة, السجل التجاري,
الموبايل, المرفق (paperclip to choose, X to remove), "حفظ (F2)".

## Requirements

### 1. Reuse, don't copy

The lookup screens (`src/components/lookup/*`) already solve URL-synced search/sort/paging, the table shell,
pagination, out-of-range pages, delete confirmation, focus handling, role-based controls, F2/Enter/Esc.
**Extract the reusable parts** into a generic list-page building block (e.g. `src/components/list/*`:
a hook for URL list state + a table/list shell that takes column definitions + row actions), then build
both `LookupPage` and the new `CompaniesPage` on it. Agencies/Sectors must behave exactly as before.

### 2. Companies list (`/data/companies`)

- Same header/breadcrumb/search/sort/pagination behaviour as the lookup pages; page size 20.
- Columns (RTL order): الشركة · السجل التجاري · الموبايل · المرفقات · مدخل البيانات · توقيت الإضافة ·
  آخر تعديل · توقيت التعديل · الإجراءات (edit/delete, hidden for `Employee`).
- Register and mobile shown with `dir="ltr"` (so `91/413` and `01272611123` read correctly); empty → `—`.
- المرفقات column: a paperclip/eye button with the count (e.g. "2") when `attachmentCount > 0`, opening the
  attachments viewer (section 4); otherwise `—`.
- Sorting on الشركة / توقيت الإضافة / توقيت التعديل.

### 3. Add / edit dialog

- Fields: الشركة (required, max 200), السجل التجاري (optional, max 50, `dir="ltr"`),
  الموبايل (optional, `dir="ltr"`, `inputMode="tel"`; client-side check for Egyptian mobile `01[0125]` + 8 digits,
  accepting Arabic-Indic digits and spaces/dashes like the server does), المرفقات.
- Attachments in the dialog:
  - Pick one or more files (button + drag-and-drop on desktop). Show each as a chip/row with name, size and an
    X to remove before saving. Validate type and size on the client with the same Arabic messages as the server.
  - When editing, list existing attachments with view and delete (delete asks for confirmation, then calls the
    API immediately).
- Saving: create/update the company first, then upload the new files (one multipart request). Show progress
  while uploading. If the company saved but the upload failed, keep the dialog open in edit mode with a clear
  Arabic error so the user can retry the upload — never lose what was saved.
- F2 / Enter / Esc and double-submit protection as in the lookup dialog. Server field errors under fields.

### 4. Attachments viewer

- A dialog listing a company's attachments (fetched with `GET /api/companies/{id}`): name, size, date, who
  added it; buttons عرض / تحميل (and حذف for Admin/Manager).
- Files are protected by the Bearer token, so **never** link straight to the API URL. Fetch with axios as a
  `Blob`, then: images → preview inside the dialog; PDF → open in a new tab via an object URL (fallback:
  download). Always `URL.revokeObjectURL` when done. Download keeps the original (Arabic) file name.

### 5. Wire-up

- `/data` hub: الشركات becomes a normal active card (no "مسودة"). Breadcrumb label stays "الشركات".
- Remove the teammate's companies draft files and the `/data/companies` draft route content.

## Out of scope

- شركات النقل and other drafts; Excel export; image editing/cropping.

## Done when

- `npm run build` (static export) and `npm run lint` pass with 0 errors and 0 warnings; `npm audit` 0 high/critical.
- Against the backend: list/search/sort/paginate; add with and without files; edit; add/remove attachments;
  view image and PDF; download keeps the Arabic file name; duplicate name / commercial register / bad mobile /
  bad file errors appear under the right field; Employee sees read-only UI but can view/download.
- الجهات and القطاعات still work exactly as before.
- No English text visible; RTL correct; light and dark mode.
- Work on branch `feature/companies` from `main`, small commits. Final message: files changed/removed,
  the reusable list building block you extracted, decisions, anything not done or assumed.
