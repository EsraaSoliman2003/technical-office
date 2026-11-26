# Task 016 (Frontend): المحاضر (meeting minutes / official records)

## Context

Arabic-only RTL app, static export, RTK Query. Read `README.md` and task 008 (خامات الشركات) in `docs/tasks`: same kind of page.
**Reuse** the list block (URL filters waiting for options, toolbar, summary), `ComboboxField`, `DateField`, `Textarea`, shared
attachments (save-then-upload, retry, viewer) and the in-app print view. The home card **المحاضر** becomes active → `/minutes/`.

## Backend API (backend task 014)

| Method | Route | Success |
|---|---|---|
| GET | `/api/minutes?projectId=&dateFrom=&dateTo=&search=&page=&pageSize=20&sortBy=&sortDir=` | `PagedResult<MinuteItem>` |
| GET | `/api/minutes/export?…` | `MinuteItem[]` (cap 5000 → 400 `errors.search`) |
| GET / POST / PUT / DELETE | `/api/minutes[/{id}]` | body `{ date, projectId, subject, notes }` |
| POST / GET / DELETE | `/api/minutes/{id}/attachments[/{attachmentId}]` | multipart `files` (max 10) / file / 204 |
| GET | `/api/projects/options` | `[{ id, name }]` |

```ts
type MinuteItem = {
  id: string; date: string; // yyyy-MM-dd
  projectId: string; projectName: string; subject: string; notes: string | null; attachmentCount: number;
  createdAt: string; createdByName: string | null; updatedAt: string | null; updatedByName: string | null;
};
```
Errors: 400 `date`, `projectId`, `subject`, `notes`, `dateFrom`/`dateTo`, `files`. Check the shapes against the backend DTOs.

## Requirements

### 1. List (`/minutes`, title "المحاضر")

- Filters (URL-synced): **اسم المشروع** (Combobox, clearable), **من تاريخ / إلى تاريخ** (two clearable DateFields;
  client check "من" ≤ "إلى"), **بحث شامل**.
- Columns: التاريخ (`yyyy/MM/dd`, sortable, default newest first) · اسم المشروع (sortable) · بخصوص (the main column: wide,
  wraps up to 3 lines with the full text available on hover/focus, mixed Arabic/Latin readable — use `dir="auto"` on the text)
  · ملاحظات (clamped) · المرفقات (count → viewer) · audit · الإجراءات.
- Summary: **عدد المحاضر** (total count, like the old "724").
- **PDF / طباعة** with the shared print view: title "المحاضر", active filters, التاريخ · اسم المشروع · بخصوص · ملاحظات
  (multi-line cells).

### 2. Add / edit dialog

- التاريخ (required DateField, default **today** on add), المشروع (required Combobox; pre-filled from the list's project
  filter on add), بخصوص (required Textarea, max 4000, counter, `dir="auto"`), ملاحظات (Textarea 2000), المرفقات (shared, max 10).
- F2 saves (Enter in the textareas makes a new line), Esc, double-submit, save-then-upload + retry, server errors under fields.

### 3. Wire-up

- Home card **المحاضر** → `/minutes/` (no "مسودة"/"قريبًا"); breadcrumb "المحاضر".
- The projects page's delete shows the backend's 409 ("…مستخدم في المحاضر") as a toast (check the existing flow does).

## Done when

- `npm run build` (static export) and `npm run lint`: 0 errors / 0 warnings; `npm audit` 0 high/critical.
- Against the backend: list/filters (project, dates, search — URL refresh), sort, paging, count, print, add/edit/delete with files,
  long mixed-language subjects display well, Employee read-only.
- Everything else unchanged. No English text; RTL; light/dark.
- Branch `feature/minutes` from `main`, small commits. Final message: files changed, reused pieces, assumptions.
