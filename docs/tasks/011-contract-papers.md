# Task 011 (Frontend): Contracts phase 2 — الأوراق المستلمة (received papers)

## Context

Read `README.md` and task 010 (Contracts phase 1). This phase adds the **"الأوراق المستلمة خاصة بالمشروع"** table to the
contract dialog: papers received for a contract, each with attachments. Reuse the existing pieces (Modal, DateField,
Textarea, shared attachments with save-then-upload and the viewer, ConfirmDialog, error mapping). Don't copy.

## Backend API (backend task 010)

| Method | Route | Success |
|---|---|---|
| GET | `/api/contracts/{contractId}/papers?sortBy=&sortDir=` | `ContractPaperDto[]` |
| POST / PUT / DELETE | `/api/contracts/{contractId}/papers[/{paperId}]` | body `{ subject, receivedDate, exitDate, notes }` |
| POST / GET / DELETE | `/api/contracts/{contractId}/papers/{paperId}/attachments[/{attachmentId}]` | multipart `files` (max 5) / file / 204 |

```ts
type ContractPaperDto = {
  id: string; contractId: string; subject: string;
  receivedDate: string | null; exitDate: string | null; // yyyy-MM-dd
  notes: string | null; isPending: boolean; // received, not sent out yet
  attachments: AttachmentDto[];
  createdAt: string; createdByName: string | null; updatedAt: string | null; updatedByName: string | null;
};
```
Contract list items and detail now also have `paperCount` and `pendingPaperCount`.
Errors: 400 `subject`, `receivedDate`, `exitDate` ("تاريخ الخروج يجب ألا يسبق تاريخ الاستلام"), `notes`, `files`; 404 when the
contract or paper is gone.

## Requirements

### 1. In the contract dialog (edit mode)

- A section **"الأوراق المستلمة خاصة بالمشروع"** with a compact table: بخصوص · تاريخ الاستلام · تاريخ الخروج · ملاحظات
  (clamped) · المرفقات (count → viewer) · الإجراءات (تعديل / حذف, hidden for Employee). Pending papers get a small
  "معلقة" badge. Empty state: "لا توجد أوراق مستلمة".
- **"إضافة ورقة"** opens a small nested dialog (top-most modal handles Esc/F2): بخصوص (required, 500), تاريخ الاستلام,
  تاريخ الخروج (both clearable `DateField`s; client check exit ≥ received with the server's message), ملاحظات (Textarea 2000),
  المرفقات (shared section, max 5) with the save-then-upload + retry flow. Edit uses the same dialog.
- Delete: ConfirmDialog showing the subject; then remove from the table.
- In **create mode** (contract not saved yet) the section shows "احفظ العقد أولاً لإضافة الأوراق" instead of the table
  (after the contract's first save the dialog switches to edit mode, as it already does for attachments).
- Cache: papers of a contract have their own tag; saving/deleting a paper refreshes them and the contract list (paper counts).

### 2. Contracts list

- New column **الأوراق** showing `paperCount`, with `pendingPaperCount` as a badge ("2 معلقة") when > 0.
- Print view: add the الأوراق column (count only).

## Out of scope

السلفة (phase 3) and المستخلصات (phase 4).

## Done when

- `npm run build` (static export) and `npm run lint`: 0 errors / 0 warnings; `npm audit` 0 high/critical.
- Against the backend: add / edit / delete papers with dates, notes and files; pending badge; date-order error under the field;
  create-mode hint; paper counts in the list; Employee read-only.
- Everything else unchanged. No English text; RTL; light/dark.
- Branch `feature/contract-papers` from `main`, small commits. Final message: files changed, reused pieces, assumptions.
