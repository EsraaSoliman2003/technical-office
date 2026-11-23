"use client";

import { useId, useMemo, useRef, useState, type DragEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { AlertTriangle, FileText, Image as ImageIcon, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { applyServerFieldErrors, useFocusAfterRemoval, useSaveShortcut } from "@/components/list/formHelpers";
import { Button, ConfirmDialog, Input, Modal } from "@/components/ui";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MESSAGES,
  formatFileSize,
  MAX_ATTACHMENTS,
  MAX_UPLOAD_TOTAL_BYTES,
  UPLOAD_TOTAL_MESSAGE,
  validateAttachment,
} from "@/lib/attachments";
import { cn } from "@/lib/cn";
import {
  companyApi,
  companyAttachmentTags,
  uploadCompanyAttachments,
  useCreateCompanyMutation,
  useGetCompanyQuery,
  useRemoveCompanyAttachmentMutation,
  useUpdateCompanyMutation,
} from "@/rtk/endpoints/companyApi";
import { useAppDispatch } from "@/rtk/hooks";
import type { AttachmentDto, CompanyInput, CompanyListItemDto } from "@/types/company";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE, type ApiFailure } from "@/utils/apiFailure";
import { getCompanySchema, normalizeMobile, type CompanySchemaType } from "@/validation/companySchema";
import { AttachmentList, AttachmentPreview } from "./AttachmentList";
import { useAttachmentFiles } from "./useAttachmentFiles";

type CompanyFormDialogProps = {
  /** Company to edit; omit to add a new one. */
  company?: CompanyListItemDto;
  onClose: () => void;
  /** Called after the company was created (also when its upload then failed). */
  onCreated?: () => void;
};

type PendingFile = { key: string; file: File };

const FORM_FIELDS = ["name", "commercialRegister", "mobile"] as const;

function toInput(values: CompanySchemaType): CompanyInput {
  return {
    name: values.name,
    commercialRegister: values.commercialRegister || null,
    mobile: values.mobile ? normalizeMobile(values.mobile) : null,
  };
}

function sameInput(a: CompanyInput, b: CompanyInput | null) {
  return b !== null && a.name === b.name && a.commercialRegister === b.commercialRegister && a.mobile === b.mobile;
}

/**
 * Add/edit a company with attachments. Save (button, Enter or F2): create/update the company,
 * then upload the new files in one request. If the upload fails after the company was saved,
 * the dialog stays open in edit mode so the upload can be retried. Esc closes. Mount it only while open.
 */
export default function CompanyFormDialog({ company, onClose, onCreated }: CompanyFormDialogProps) {
  const formId = useId();
  const filesHintId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickButtonRef = useRef<HTMLButtonElement>(null);
  const savingRef = useRef(false);
  const dispatch = useAppDispatch();

  // The company being edited; set after a create, so a failed upload can be retried as an edit.
  const [companyId, setCompanyId] = useState<string | null>(company?.id ?? null);
  // Same id, read by onSubmit: set synchronously after the POST, so a submit that runs before the
  // re-render (stale `companyId` = null) cannot create the company a second time.
  const companyIdRef = useRef<string | null>(company?.id ?? null);
  // Last values saved on the server (skip the PUT when only files are added).
  const savedInputRef = useRef<CompanyInput | null>(
    company
      ? { name: company.name, commercialRegister: company.commercialRegister, mobile: company.mobile }
      : null
  );

  const { currentData: details } = useGetCompanyQuery(companyId ?? skipToken);
  const existing = details?.attachments;
  const existingCount = existing?.length ?? company?.attachmentCount ?? 0;

  const [createCompany] = useCreateCompanyMutation();
  const [updateCompany] = useUpdateCompanyMutation();

  const form = useForm<CompanySchemaType>({
    resolver: zodResolver(getCompanySchema()),
    defaultValues: {
      name: company?.name ?? "",
      commercialRegister: company?.commercialRegister ?? "",
      mobile: company?.mobile ?? "",
    },
  });
  const { errors } = form.formState;

  const [saving, setSaving] = useState(false);
  /** Upload progress in %; null = size unknown; undefined = not uploading. */
  const [progress, setProgress] = useState<number | null | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ---- New files ----
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const nextKeyRef = useRef(0);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || savingRef.current) return;
    const messages: string[] = [];
    const accepted: PendingFile[] = [];
    let available = MAX_ATTACHMENTS - existingCount - pending.length;
    let totalBytes = pending.reduce((sum, { file }) => sum + file.size, 0);
    let overLimit = false;
    let overTotal = false;

    for (const file of Array.from(fileList)) {
      const duplicate = [...pending, ...accepted].some(
        ({ file: other }) =>
          other.name === file.name && other.size === file.size && other.lastModified === file.lastModified
      );
      if (duplicate) continue;
      const error = validateAttachment(file);
      if (error) {
        messages.push(`${file.name}: ${error}`);
      } else if (available <= 0) {
        overLimit = true;
      } else if (totalBytes + file.size > MAX_UPLOAD_TOTAL_BYTES) {
        overTotal = true;
      } else {
        accepted.push({ key: `file-${nextKeyRef.current++}`, file });
        available--;
        totalBytes += file.size;
      }
    }
    if (overLimit) messages.push(ATTACHMENT_MESSAGES.count);
    if (overTotal) messages.push(UPLOAD_TOTAL_MESSAGE);

    setPending((current) => [...current, ...accepted]);
    setFilesError(messages.length > 0 ? messages.join("\n") : null);
  };

  const removePending = (key: string) => {
    setPending((current) => current.filter((item) => item.key !== key));
    setFilesError(null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  // ---- Saved attachments (edit) ----
  const files = useAttachmentFiles(companyId ?? "");
  const [confirming, setConfirming] = useState<AttachmentDto | null>(null);
  const [removeAttachment, { isLoading: removingAttachment }] = useRemoveCompanyAttachmentMutation();
  const removingRef = useRef(false);
  const existingIds = useMemo(() => existing?.map((attachment) => attachment.id), [existing]);
  const markRemoved = useFocusAfterRemoval(existingIds, pickButtonRef);

  const confirmRemove = async () => {
    if (!confirming || !companyId || removingRef.current) return;
    removingRef.current = true;
    let result;
    try {
      result = await removeAttachment({ companyId, attachmentId: confirming.id });
    } finally {
      removingRef.current = false;
    }
    const removed = confirming;
    setConfirming(null);

    if ("error" in result) {
      const failure = isApiFailure(result.error) ? result.error : undefined;
      toast.error(failure?.status === 403 ? NO_PERMISSION_MESSAGE : getFailureMessage(failure));
      return;
    }
    toast.success("تم حذف المرفق");
    if (files.preview?.attachment.id === removed.id) files.closePreview();
    markRemoved(removed.id);
  };

  // ---- Save ----
  const showSaveError = (failure: ApiFailure | undefined) => {
    if (failure && (failure.status === 400 || failure.status === 409)) {
      const shown = applyServerFieldErrors(failure, FORM_FIELDS, (field, message, focus) =>
        form.setError(field, { type: "server", message }, { shouldFocus: focus })
      );
      if (shown) return;
    }
    toast.error(failure?.status === 403 ? NO_PERMISSION_MESSAGE : getFailureMessage(failure));
  };

  /** `sent`: the files of the failed request, in order (server keys `files[i]` index into it). */
  const showUploadError = (failure: ApiFailure | undefined, sent: File[]) => {
    const filesMessages: string[] = [];
    for (const [key, messages] of Object.entries(failure?.fieldErrors ?? {})) {
      // "files" (whole request) or "files[i]" / "files[i].…" (one file)
      const match = /^files(?:\[(\d+)\])?(?:$|\.)/i.exec(key);
      if (!match) continue;
      const file = match[1] !== undefined ? sent[Number(match[1])] : undefined;
      for (const message of messages) filesMessages.push(file ? `${file.name}: ${message}` : message);
    }
    if (filesMessages.length > 0) setFilesError(filesMessages.join("\n"));
    const reason =
      failure?.status === 403 ? NO_PERMISSION_MESSAGE : filesMessages.length > 0 ? null : getFailureMessage(failure);
    setUploadError(
      `تم حفظ بيانات الشركة، لكن تعذر رفع المرفقات${reason ? `: ${reason}` : "."} يمكنك إعادة المحاولة بالضغط على «حفظ».`
    );
  };

  const onSubmit = async (values: CompanySchemaType) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setUploadError(null);
    try {
      const input = toInput(values);
      let id = companyIdRef.current;

      if (!id || !sameInput(input, savedInputRef.current)) {
        const result = id ? await updateCompany({ id, body: input }) : await createCompany(input);
        if ("error" in result) {
          showSaveError(isApiFailure(result.error) ? result.error : undefined);
          return;
        }
        savedInputRef.current = input;
        if (!id) {
          id = result.data.id;
          companyIdRef.current = id;
          setCompanyId(id);
          onCreated?.();
        }
      }

      if (pending.length > 0) {
        setProgress(0);
        const sent = pending.map(({ file }) => file);
        try {
          await uploadCompanyAttachments(id, sent, setProgress);
        } catch (error) {
          showUploadError(isApiFailure(error) ? error : undefined, sent);
          return;
        } finally {
          setProgress(undefined);
          dispatch(companyApi.util.invalidateTags(companyAttachmentTags(id)));
        }
        setPending([]);
      }

      toast.success("تم الحفظ بنجاح");
      onClose();
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  useSaveShortcut(() => {
    if (!savingRef.current && confirming === null) formRef.current?.requestSubmit();
  });

  const busy = saving || removingAttachment;
  const isEdit = companyId !== null;
  const uploading = progress !== undefined;

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={isEdit ? "تعديل شركة" : "إضافة شركة"}
        size="lg"
        preventClose={busy}
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              إلغاء
            </Button>
            <Button type="submit" form={formId} loading={saving}>
              حفظ (F2)
            </Button>
          </>
        }
      >
        <form
          id={formId}
          ref={formRef}
          noValidate
          onSubmit={(event) => {
            if (savingRef.current) {
              event.preventDefault(); // prevent double submit
              return;
            }
            void form.handleSubmit(onSubmit)(event);
          }}
          className="space-y-4"
        >
          {uploadError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger"
            >
              <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
              <p>{uploadError}</p>
            </div>
          )}

          <Input
            label="الشركة"
            required
            autoComplete="off"
            data-autofocus
            readOnly={saving}
            error={errors.name?.message}
            {...form.register("name")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="السجل التجاري"
              dir="ltr"
              autoComplete="off"
              readOnly={saving}
              error={errors.commercialRegister?.message}
              {...form.register("commercialRegister")}
            />
            <Input
              label="الموبايل"
              type="tel"
              dir="ltr"
              inputMode="tel"
              autoComplete="off"
              readOnly={saving}
              error={errors.mobile?.message}
              {...form.register("mobile")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span id={`${filesHintId}-label`} className="text-sm font-semibold text-foreground">
                المرفقات
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {existingCount + pending.length} من {MAX_ATTACHMENTS}
              </span>
            </div>

            <div
              role="group"
              aria-labelledby={`${filesHintId}-label`}
              onDragOver={(event) => {
                event.preventDefault();
                if (!saving) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
                dragging ? "border-primary bg-primary-soft" : "border-border bg-surface-muted/40"
              )}
            >
              <Paperclip size={22} aria-hidden="true" className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">اسحب الملفات وأفلتها هنا، أو</p>
              <Button
                ref={pickButtonRef}
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                aria-describedby={filesHintId}
              >
                <Paperclip size={14} aria-hidden="true" />
                اختيار ملفات
              </Button>
              <p id={filesHintId} className="text-xs text-muted-foreground">
                ملفات PDF أو صور، بحد أقصى 10 ميجابايت للملف
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ATTACHMENT_ACCEPT}
                tabIndex={-1}
                aria-hidden="true"
                className="hidden"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = ""; // allow picking the same file again
                }}
              />
            </div>

            {filesError && (
              <p role="alert" className="text-xs whitespace-pre-line text-danger">
                {filesError}
              </p>
            )}

            {pending.length > 0 && (
              <ul aria-label="ملفات جديدة" className="flex flex-wrap gap-2">
                {pending.map(({ key, file }) => {
                  const Icon = file.type.startsWith("image/") ? ImageIcon : FileText;
                  return (
                    <li
                      key={key}
                      className="flex max-w-full items-center gap-2 rounded-lg border border-border bg-surface py-1.5 ps-2.5 pe-1 text-sm"
                    >
                      <Icon size={16} aria-hidden="true" className="shrink-0 text-primary-text" />
                      <span dir="auto" className="max-w-56 truncate font-semibold" title={file.name}>
                        {file.name}
                      </span>
                      <span dir="ltr" className="text-xs text-muted-foreground tabular-nums">
                        {formatFileSize(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePending(key)}
                        disabled={saving}
                        aria-label={`إزالة ${file.name}`}
                        title="إزالة"
                        className="rounded-md p-1 text-muted-foreground hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {uploading && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">
                  جاري رفع المرفقات…{" "}
                  {progress !== null && <span className="tabular-nums">{progress}%</span>}
                </p>
                <div
                  role="progressbar"
                  aria-label="رفع المرفقات"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress ?? undefined}
                  className="h-2 overflow-hidden rounded-full bg-surface-muted"
                >
                  <div
                    className={cn("h-full rounded-full bg-primary transition-[width]", progress === null && "animate-pulse")}
                    style={{ width: `${progress ?? 100}%` }}
                  />
                </div>
              </div>
            )}

            {existing && existing.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground">المرفقات المحفوظة</p>
                <AttachmentList
                  attachments={existing}
                  busy={files.busy}
                  onView={files.view}
                  onDownload={files.download}
                  onDelete={setConfirming}
                  disabled={saving}
                />
                {files.preview && <AttachmentPreview preview={files.preview} onClose={files.closePreview} />}
              </div>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirming !== null}
        loading={removingAttachment}
        message={confirming ? `هل أنت متأكد من حذف المرفق "${confirming.fileName}"؟` : undefined}
        onConfirm={confirmRemove}
        onCancel={() => setConfirming(null)}
        fallbackFocusRef={pickButtonRef}
      />
    </>
  );
}
