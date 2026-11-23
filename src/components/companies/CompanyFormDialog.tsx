"use client";

import { useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AttachmentUploadField } from "@/components/attachments/AttachmentUploadField";
import { SavedAttachments } from "@/components/attachments/SavedAttachments";
import { usePendingFiles, useWindowFileDropGuard } from "@/components/attachments/usePendingFiles";
import { applyServerFieldErrors, isInTopDialog, useSaveShortcut } from "@/components/list/formHelpers";
import { useListFallbackFocus } from "@/components/list/ListPage";
import { Button, Input, Modal } from "@/components/ui";
import { uploadAttachments } from "@/lib/attachmentTransfer";
import {
  companyApi,
  companyAttachmentsUrl,
  companyAttachmentTags,
  useCreateCompanyMutation,
  useGetCompanyQuery,
  useRemoveCompanyAttachmentMutation,
  useUpdateCompanyMutation,
} from "@/rtk/endpoints/companyApi";
import { useAppDispatch } from "@/rtk/hooks";
import type { CompanyInput, CompanyListItemDto } from "@/types/company";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE, type ApiFailure } from "@/utils/apiFailure";
import { getCompanySchema, normalizeMobile, type CompanySchemaType } from "@/validation/companySchema";

type CompanyFormDialogProps = {
  /** Company to edit; omit to add a new one. */
  company?: CompanyListItemDto;
  onClose: () => void;
  /** Called after the company was created (also when its upload then failed). */
  onCreated?: () => void;
};

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
  const formRef = useRef<HTMLFormElement>(null);
  const pickButtonRef = useRef<HTMLButtonElement>(null);
  const savingRef = useRef(false);
  const dispatch = useAppDispatch();
  // If the opener is gone on close (e.g. the row was deleted meanwhile): "إضافة" or the table card.
  const listFallbackFocusRef = useListFallbackFocus();
  useWindowFileDropGuard();

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
  const [removeAttachment] = useRemoveCompanyAttachmentMutation();

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const newFiles = usePendingFiles({
    existingCount: existing?.length ?? company?.attachmentCount ?? 0,
    disabled: saving,
  });

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

  const showUploadError = (failure: ApiFailure | undefined, sent: File[]) => {
    const hasFileErrors = newFiles.showServerErrors(failure, sent);
    const reason =
      failure?.status === 403 ? NO_PERMISSION_MESSAGE : hasFileErrors ? null : getFailureMessage(failure);
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

      if (newFiles.files.length > 0) {
        newFiles.setProgress(0);
        const sent = newFiles.files;
        try {
          await uploadAttachments(companyAttachmentsUrl(id), sent, { onProgress: newFiles.setProgress });
        } catch (error) {
          showUploadError(isApiFailure(error) ? error : undefined, sent);
          return;
        } finally {
          newFiles.setProgress(undefined);
          dispatch(companyApi.util.invalidateTags(companyAttachmentTags(id)));
        }
        newFiles.clear();
      }

      toast.success("تم الحفظ بنجاح");
      onClose();
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // Not while a confirmation (deleting a saved attachment) is open over this dialog.
  useSaveShortcut(() => {
    if (!savingRef.current && isInTopDialog(formRef.current)) formRef.current?.requestSubmit();
  });

  const isEdit = companyId !== null;

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "تعديل شركة" : "إضافة شركة"}
      size="lg"
      preventClose={saving}
      fallbackFocusRef={listFallbackFocusRef}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
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
          <AttachmentUploadField label="المرفقات" files={newFiles} disabled={saving} pickButtonRef={pickButtonRef} />

          {companyId && existing && existing.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground">المرفقات المحفوظة</p>
              <SavedAttachments
                attachments={existing}
                baseUrl={companyAttachmentsUrl(companyId)}
                onRemove={(attachment) => removeAttachment({ companyId, attachmentId: attachment.id })}
                disabled={saving}
                fallbackFocusRef={pickButtonRef}
              />
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
