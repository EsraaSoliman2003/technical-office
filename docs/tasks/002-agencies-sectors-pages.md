# Task 002 (Frontend): الجهات and القطاعات pages

## Context

Depends on **task 001** (foundation, RTK Query base API, shared UI kit, shell, `/data` hub) — read
`docs/tasks/001-foundation-and-home.md` first and build on what it created.

The app is **Arabic only** (RTL). This task adds the first two master-data screens:

| Arabic | Route | API resource |
|---|---|---|
| الجهات | `/data/agencies` | `/api/agencies` |
| القطاعات | `/data/sectors` | `/api/sectors` |

Both are **name-only lookups**, and many more will follow (انواع المشاريع, …).
Build **one reusable lookup screen** and make these two pages thin configurations of it, e.g.
`<LookupPage resource="agencies" title="الجهات" fieldLabel="الجهة" />`.

## Backend API (same for both resources)

All require the Bearer token.

| Method | Route | Body | Success |
|---|---|---|---|
| GET | `/api/{resource}?search=&page=1&pageSize=20&sortBy=name&sortDir=asc` | — | 200 `PagedResult<LookupDto>` |
| GET | `/api/{resource}/{id}` | — | 200 `LookupDto` |
| POST | `/api/{resource}` | `{ "name" }` | 201 `LookupDto` |
| PUT | `/api/{resource}/{id}` | `{ "name" }` | 200 `LookupDto` |
| DELETE | `/api/{resource}/{id}` | — | 204 |

```ts
type LookupDto = {
  id: string; name: string;
  createdAt: string; createdByName: string | null;   // ISO UTC
  updatedAt: string | null; updatedByName: string | null;
};
type PagedResult<T> = { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number };
```

- `sortBy`: `name` | `createdAt` | `updatedAt` (default `createdAt`), `sortDir`: `asc` | `desc` (default `desc`).
- Errors (ProblemDetails, Arabic messages): `400` validation `errors.name`, `409` duplicate name
  `errors.name = ["هذا الاسم مسجل من قبل"]`, `403` no permission (role `Employee`), `404` not found.
- Write permission: roles `Admin` and `Manager` only. `Employee` is read-only.

## Old screen (what users are used to)

Title at the top, a search box with a clear (X) button, an **"اضافة +"** button, and a table:
`تعديل` · `حذف` · **name** · `مدخل البيانات` · `توقيت الإضافة` · `اخر تعديل` · `توقيت التعديل`.
Add/edit opens a small dialog with one field and a **"حفظ (F2)"** button. Keep that workflow,
with a modern look.

## Requirements

### 1. Data (RTK Query)

- Inject endpoints into the base API from task 001: `list`, `get`, `create`, `update`, `remove`,
  parameterised by resource. Use cache tags per resource so create/update/delete refresh the list.
- Types in `src/types/` (`LookupDto`, `PagedResult<T>`, list query params).

### 2. List page

- Page header: title, breadcrumb (الرئيسية / البيانات / {title}), and an **"إضافة"** button
  (hidden for `Employee`).
- Search input: debounced (~400 ms), clear (X) button, resets to page 1, keeps the text in the URL
  query string (`?search=...&page=2`) so refresh/back keeps the state. Read query params on the client
  (this is a static export).
- Table columns (RTL order): **{fieldLabel}** · مدخل البيانات · توقيت الإضافة · آخر تعديل ·
  توقيت التعديل · الإجراءات (edit and delete icon buttons with Arabic tooltips/`aria-label`; hidden for `Employee`).
- Sorting by clicking the name / توقيت الإضافة / توقيت التعديل headers (with an arrow indicator).
- Pagination under the table: page numbers + "عدد النتائج: N". Page size 20.
- Dates shown in the user's local time as `yyyy/MM/dd HH:mm` with Latin digits (like the old system);
  empty values show `—`.
- States: skeleton rows while loading, `EmptyState` ("لا توجد بيانات" / "لا توجد نتائج للبحث"),
  error state with a "إعادة المحاولة" button.
- Responsive: on small screens the table scrolls horizontally inside its card (the page itself must not).

### 3. Add / edit dialog

- Reuse the `Modal` from task 001. Title: "إضافة {fieldLabel}" / "تعديل {fieldLabel}".
- One field ({fieldLabel}), autofocused; zod: required after trim (`"الاسم مطلوب"`), max 200
  (`"الاسم يجب ألا يزيد عن 200 حرف"`).
- Save with the button, **Enter**, or **F2** (shortcut shown on the button: "حفظ (F2)"); **Esc** closes.
  Disable the button and show a spinner while saving; prevent double submit.
- Server `400`/`409` errors appear under the field; other errors as a toast.
- On success: close, toast "تم الحفظ بنجاح", list refreshes (new item visible).

### 4. Delete

- `ConfirmDialog` from task 001 showing the item's name. On success toast "تم الحذف بنجاح".
  If the current page becomes empty, go back one page.

### 5. Permissions in the UI

- Read the role from the auth slice. `Employee`: no add/edit/delete controls.
  If the API still returns 403, show toast "ليس لديك صلاحية لتنفيذ هذا الإجراء".

### 6. Wire-up

- `/data` hub cards for الجهات and القطاعات link here (already active from task 001).

## Out of scope

- Export to Excel / printing, bulk actions, other lookups.

## Done when

- `npm run build` (static export) succeeds and `npm run lint` has no errors.
- Against the real backend, for both pages: list, search, sort, paginate, add, edit, delete,
  duplicate-name error under the field, Employee sees read-only UI.
- Adding the next lookup page would only need a new route file with a `<LookupPage .../>` line.
- No English text visible in the UI; RTL correct; light and dark mode both look right.
- Work is on a new branch `feature/agencies-sectors` (not `main`), in small, clear commits.
- Final message lists: files changed, decisions, anything not done or assumed.
