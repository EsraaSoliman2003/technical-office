# Task 007 (Frontend): المشاريع (Projects) page

## Context

Arabic-only RTL app, static export, RTK Query on the shared axios instance. Read `README.md` and tasks 004
(Companies: list building block, attachments upload/viewer) in `docs/tasks` first — **reuse those pieces**, don't copy
them. `/data/projects` currently shows a teammate's UI draft (`src/features/projects/*`, local state): replace it and
delete the draft code only it uses. Do **not** touch the خامات المشاريع draft (`/data/project-materials`) — that is a
different, later feature (material deliveries).

## Backend API (backend task 006)

| Method | Route | Body | Success |
|---|---|---|---|
| GET | `/api/projects?search=&status=&page=&pageSize=20&sortBy=&sortDir=` | — | `PagedResult<ProjectListItemDto>` |
| GET | `/api/projects/{id}` | — | `ProjectDto` |
| POST / PUT | `/api/projects` / `/api/projects/{id}` | `SaveProjectRequest` | `ProjectDto` |
| DELETE | `/api/projects/{id}` | — | 204 |
| POST | `/api/projects/{id}/attachments?category=materials\|offers` | multipart `files` | `AttachmentDto[]` |
| GET / DELETE | `/api/projects/{id}/attachments/{attachmentId}` | — | file / 204 |
| GET | `/api/materials/options` | — | `[{ id, name }]` (all materials, sorted) |

```ts
type ProjectStatus = "Study" | "InProgress" | "Completed"; // دراسة / جاري التنفيذ / منتهي
type ProjectMaterialDto = { materialId: string; materialName: string; value: number };
type ProjectListItemDto = {
  id: string; name: string; allocatedAmount: number; status: ProjectStatus; progressPercent: number;
  completionDate: string | null; // "yyyy-MM-dd"
  materials: ProjectMaterialDto[]; attachmentCounts: { materials: number; offers: number };
  createdAt: string; createdByName: string | null; updatedAt: string | null; updatedByName: string | null;
};
type ProjectDto = ProjectListItemDto & { attachments: (AttachmentDto & { category: "materials" | "offers" })[] };
type SaveProjectRequest = {
  name: string; allocatedAmount: number; status: ProjectStatus; progressPercent: number;
  completionDate: string | null; materials: { materialId: string; value: number }[]; // PUT replaces the list
};
```

Errors: 400 with keys `name`, `allocatedAmount`, `status`, `progressPercent`, `completionDate`,
`materials`, `materials[i].materialId`, `materials[i].value`, `files`; 409 `name`.
Limits: max 50 materials; attachments max 10 per category, PDF/JPEG/PNG/WEBP, same size rules as Companies.

## Requirements

### 1. List (`/data/projects`)

- Built on the list building block (search, sort, paging, URL state, delete, Employee read-only, F2/Esc).
- **Status filter** above the table: الكل · دراسة · جاري التنفيذ · منتهي (segmented buttons), synced to `?status=`.
- Columns (RTL order): المشروع · المخصص · موقف المشروع · الخامات · نسبة التنفيذ · تاريخ النهو · المرفقات ·
  مدخل البيانات · توقيت الإضافة · آخر تعديل · توقيت التعديل · الإجراءات.
  - المخصص: thousands separators, 2 decimals, Latin digits, `dir="ltr"` (e.g. `220,000,000.00`).
  - موقف المشروع: coloured badge (دراسة neutral, جاري التنفيذ accent/amber, منتهي green), works in dark mode.
  - الخامات: compact chips `حديد: 500.00` (max 3 visible + "+N" with a tooltip/popover listing all); `—` if none.
  - نسبة التنفيذ: small progress bar + `95.00%`.
  - تاريخ النهو: `yyyy/MM/dd` (date only, no timezone shift!), `—` if empty.
  - المرفقات: two small buttons "خامات (n)" and "العروض (n)" opening the attachments viewer filtered to that category.
- Sortable: المشروع, المخصص, نسبة التنفيذ, تاريخ النهو, توقيت الإضافة, توقيت التعديل.

### 2. Add / edit dialog (wider than the lookup dialog; scrolls inside on small screens)

- المشروع (required, max 200).
- المخصص (number ≥ 0, 2 decimals, `dir="ltr"`, shows thousands separators while typing or on blur; accept Arabic-Indic digits).
- **الخامات — the requested change:** a "إضافة خامة" button adds a row: material **combobox** (options from
  `/api/materials/options`, type-to-filter in Arabic, already-chosen materials hidden/disabled) + القيمة (decimal ≥ 0,
  2 decimals, `dir="ltr"`) + remove (X). Empty state: "لم تتم إضافة خامات". Max 50 rows. Keyboard friendly (Enter in the
  last value adds a new row? — optional). Server errors `materials[i].*` appear on the right row.
- موقف المشروع (required select: دراسة / جاري التنفيذ / منتهي).
- نسبة التنفيذ % (0–100, 2 decimals).
- تاريخ النهو (optional date input; send `yyyy-MM-dd`, clearable).
- Attachments: two sections **خامات** and **العروض**, each with the Companies upload UX (pick/drag, chips, remove,
  existing files with view/delete, client validation incl. the 50 MB-per-upload total). Save flow like Companies: save the
  project, then upload each category (one request per category); on upload failure keep the dialog open in edit mode with
  an Arabic error and retry (never create the project twice).
- Generalize the Companies attachment components so both features share them (category-aware), instead of duplicating.

### 3. Wire-up

- `/data` hub: المشاريع becomes an active card (no "مسودة"). Breadcrumb label stays "المشاريع".

## Done when

- `npm run build` (static export) and `npm run lint`: 0 errors / 0 warnings; `npm audit` 0 high/critical.
- Against the backend: list/search/filter/sort/paginate; create with and without materials/files; edit (add, change,
  remove materials); attachments per category; duplicate material / bad values show under the right field; Employee read-only.
- Companies and the lookup pages still behave as before. No English text; RTL; light/dark.
- Branch `feature/projects` from `main`, small commits. Final message: files changed/removed, what was generalized, assumptions.
