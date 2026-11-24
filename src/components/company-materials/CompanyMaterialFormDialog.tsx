"use client";

import { useId, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AttachmentUploadField } from "@/components/attachments/AttachmentUploadField";
import { SavedAttachments } from "@/components/attachments/SavedAttachments";
import { usePendingFiles, useWindowFileDropGuard } from "@/components/attachments/usePendingFiles";
import { applyServerFieldErrors, isInTopDialog, useSaveShortcut } from "@/components/list/formHelpers";
import { useListFallbackFocus } from "@/components/list/ListPage";
import { Button, Combobox, Input, Modal, Textarea } from "@/components/ui";
import { uploadAttachments } from "@/lib/attachmentTransfer";
import { checkDecimal, formatQuantity, parseDecimal } from "@/lib/numbers";
import {
  companyMaterialApi,
  companyMaterialAttachmentsUrl,
  companyMaterialAttachmentTags,
  MAX_COMPANY_MATERIAL_ATTACHMENTS,
  useCreateCompanyMaterialMutation,
  useGetCompanyMaterialQuery,
  useRemoveCompanyMaterialAttachmentMutation,
  useUpdateCompanyMaterialMutation,
} from "@/rtk/endpoints/companyMaterialApi";
import { useAppDispatch } from "@/rtk/hooks";
import type {
  CompanyMaterialFilters,
  CompanyMaterialItem,
  SaveCompanyMaterialRequest,
} from "@/types/companyMaterial";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE, type ApiFailure } from "@/utils/apiFailure";
import {
  getCompanyMaterialSchema,
  MAX_NOTES_LENGTH,
  type CompanyMaterialFormValues,
  type CompanyMaterialSchemaType,
} from "@/validation/companyMaterialSchema";
import type { OptionList } from "@/components/options/useOptionList";
import { useOptionLists } from "./useOptionLists";

type CompanyMaterialFormDialogProps = {
  /** Row to edit; omit to add a new one. */
  item?: CompanyMaterialItem;
  /** When adding: the list's active filters pre-fill المشروع / الخامة / الشركة. */
  prefill?: CompanyMaterialFilters;
  onClose: () => void;
  /** Called after the row was created (also when its upload then failed). */
  onCreated?: () => void;
};

const FORM_FIELDS = [
  "loadingPermitNumber",
  "projectId",
  "materialId",
  "companyId",
  "quantity",
  "receivingEngineer",
  "notes",
] as const;

function toRequest(values: CompanyMaterialSchemaType): SaveCompanyMaterialRequest {
  return {
    loadingPermitNumber: values.loadingPermitNumber || null,
    projectId: values.projectId,
    materialId: values.materialId,
    companyId: values.companyId,
    quantity: parseDecimal(values.quantity) ?? 0,
    receivingEngineer: values.receivingEngineer || null,
    notes: values.notes || null,
  };
}

function savedRequestOf(item: CompanyMaterialItem): SaveCompanyMaterialRequest {
  return {
    loadingPermitNumber: item.loadingPermitNumber,
    projectId: item.projectId,
    materialId: item.materialId,
    companyId: item.companyId,
    quantity: item.quantity,
    receivingEngineer: item.receivingEngineer,
    notes: item.notes,
  };
}

/**
 * Add/edit a خامات الشركات row with its البوليصة files (max 5). Save (button, Enter outside the
 * notes, or F2): create/update, then upload the new files in one request. If the upload fails,
 * the dialog stays open in edit mode so it can be retried; the row is never created twice.
 * Esc closes. Mount it only while open.
 */
export default function CompanyMaterialFormDialog({
  item,
  prefill,
  onClose,
  onCreated,
}: CompanyMaterialFormDialogProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const pickButtonRef = useRef<HTMLButtonElement>(null);
  const savingRef = useRef(false);
  const dispatch = useAppDispatch();
  const listFallbackFocusRef = useListFallbackFocus();
  // The edited row's own names show even before the lists load.
  const lists = useOptionLists(item);
  useWindowFileDropGuard();

  // The row being edited; set after a create (ref: read synchronously by onSubmit).
  const [recordId, setRecordId] = useState<string | null>(item?.id ?? null);
  const recordIdRef = useRef<string | null>(item?.id ?? null);
  // Last values saved on the server (skip the PUT when only files are added).
  const savedRequestRef = useRef<SaveCompanyMaterialRequest | null>(item ? savedRequestOf(item) : null);

  const { currentData: details } = useGetCompanyMaterialQuery(recordId ?? skipToken);
  const existing = details?.attachments;
  const [removeAttachment] = useRemoveCompanyMaterialAttachmentMutation();
  const [createRecord] = useCreateCompanyMaterialMutation();
  const [updateRecord] = useUpdateCompanyMaterialMutation();

  const form = useForm<CompanyMaterialFormValues, unknown, CompanyMaterialSchemaType>({
    resolver: zodResolver(getCompanyMaterialSchema()),
    defaultValues: {
      loadingPermitNumber: item?.loadingPermitNumber ?? "",
      projectId: item?.projectId ?? prefill?.projectId ?? "",
      materialId: item?.materialId ?? prefill?.materialId ?? "",
      companyId: item?.companyId ?? prefill?.companyId ?? "",
      quantity: item ? formatQuantity(item.quantity) : "",
      receivingEngineer: item?.receivingEngineer ?? "",
      notes: item?.notes ?? "",
    },
  });
  const { errors } = form.formState;
  const notes = useWatch({ control: form.control, name: "notes" });

  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const newFiles = usePendingFiles({
    existingCount: existing?.length ?? item?.attachmentCount ?? 0,
    maxCount: MAX_COMPANY_MATERIAL_ATTACHMENTS,
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
      `تم حفظ البيانات، لكن تعذر رفع البوليصة${reason ? `: ${reason}` : "."} يمكنك إعادة المحاولة بالضغط على «حفظ».`
    );
  };

  const onSubmit = async (values: CompanyMaterialSchemaType) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setUploadError(null);
    try {
      const request = toRequest(values);
      let id = recordIdRef.current;

      if (!id || JSON.stringify(request) !== JSON.stringify(savedRequestRef.current)) {
        const result = id ? await updateRecord({ id, body: request }) : await createRecord(request);
        if ("error" in result) {
          showSaveError(isApiFailure(result.error) ? result.error : undefined);
          return;
        }
        savedRequestRef.current = request;
        if (!id) {
          id = result.data.id;
          recordIdRef.current = id;
          setRecordId(id);
          onCreated?.();
        }
      }

      if (newFiles.files.length > 0) {
        newFiles.setProgress(0);
        const sent = newFiles.files;
        try {
          await uploadAttachments(companyMaterialAttachmentsUrl(id), sent, { onProgress: newFiles.setProgress });
        } catch (error) {
          showUploadError(isApiFailure(error) ? error : undefined, sent);
          return;
        } finally {
          newFiles.setProgress(undefined);
          dispatch(companyMaterialApi.util.invalidateTags(companyMaterialAttachmentTags(id)));
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

  const quantityField = form.register("quantity");
  const isEdit = recordId !== null;

  /** A required dropdown (المشروع / الخامة / الشركة): chosen from existing records, never typed. */
  const select = (name: "projectId" | "materialId" | "companyId", label: string, list: OptionList) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Combobox
          label={label}
          required
          options={list.options}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          inputRef={field.ref}
          loading={list.loading}
          error={errors[name]?.message ?? (list.loadError ? "تعذر تحميل القائمة" : undefined)}
          disabled={saving}
          placeholder="اكتب للبحث أو اختر من القائمة"
        />
      )}
    />
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "تعديل خامة شركة" : "إضافة خامة شركة"}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="رقم اذن التحميل"
            dir="ltr"
            autoComplete="off"
            data-autofocus
            readOnly={saving}
            error={errors.loadingPermitNumber?.message}
            {...form.register("loadingPermitNumber")}
          />
          {select("projectId", "اسم المشروع", lists.projects)}
          {select("materialId", "الخامة", lists.materials)}
          {select("companyId", "الشركة المنفذة", lists.companies)}
          <Input
            label="الكمية"
            required
            dir="ltr"
            inputMode="decimal"
            autoComplete="off"
            readOnly={saving}
            error={errors.quantity?.message}
            {...quantityField}
            onBlur={(event) => {
              void quantityField.onBlur(event);
              // "92.3" → "92.300" (only when the value is valid).
              const value = form.getValues("quantity");
              if (checkDecimal(value, 3) === "ok") form.setValue("quantity", formatQuantity(parseDecimal(value) ?? 0));
            }}
          />
          <Input
            label="المهندس المستلم"
            autoComplete="off"
            readOnly={saving}
            error={errors.receivingEngineer?.message}
            {...form.register("receivingEngineer")}
          />
        </div>

        <Textarea
          label="ملاحظات"
          rows={3}
          readOnly={saving}
          error={errors.notes?.message}
          length={notes?.length ?? 0}
          maxChars={MAX_NOTES_LENGTH}
          {...form.register("notes")}
        />

        <div className="flex flex-col gap-2">
          <AttachmentUploadField label="البوليصة" files={newFiles} disabled={saving} pickButtonRef={pickButtonRef} />
          {recordId && existing && (
            <SavedAttachments
              attachments={existing}
              baseUrl={companyMaterialAttachmentsUrl(recordId)}
              onRemove={(attachment) => removeAttachment({ id: recordId, attachmentId: attachment.id })}
              disabled={saving}
              fallbackFocusRef={pickButtonRef}
              heading={<p className="text-xs font-semibold text-muted-foreground">البوليصة المحفوظة</p>}
            />
          )}
        </div>
      </form>
    </Modal>
  );
}
