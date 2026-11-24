"use client";

import { useId, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AttachmentUploadField } from "@/components/attachments/AttachmentUploadField";
import { SavedAttachments } from "@/components/attachments/SavedAttachments";
import { usePendingFiles, useWindowFileDropGuard } from "@/components/attachments/usePendingFiles";
import { ComboboxField, DateField, QuantityField } from "@/components/form/fields";
import { applyServerFieldErrors, isInTopDialog, useSaveShortcut } from "@/components/list/formHelpers";
import { useListFallbackFocus } from "@/components/list/ListPage";
import { Button, Input, Modal, Textarea } from "@/components/ui";
import { uploadAttachments } from "@/lib/attachmentTransfer";
import { formatQuantity, parseDecimal } from "@/lib/numbers";
import {
  MAX_MATERIAL_DELIVERY_ATTACHMENTS,
  materialDeliveryApi,
  materialDeliveryAttachmentsUrl,
  materialDeliveryAttachmentTags,
  useCreateMaterialDeliveryMutation,
  useGetMaterialDeliveryQuery,
  useRemoveMaterialDeliveryAttachmentMutation,
  useUpdateMaterialDeliveryMutation,
} from "@/rtk/endpoints/materialDeliveryApi";
import { useAppDispatch } from "@/rtk/hooks";
import type {
  MaterialDeliveryFilters,
  MaterialDeliveryItem,
  SaveMaterialDeliveryRequest,
} from "@/types/materialDelivery";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE, type ApiFailure } from "@/utils/apiFailure";
import { MAX_NOTES_LENGTH } from "@/validation/codeText";
import {
  getMaterialDeliverySchema,
  type MaterialDeliveryFormValues,
  type MaterialDeliverySchemaType,
} from "@/validation/materialDeliverySchema";
import { DeliveryTotalsPanel } from "./DeliveryTotalsPanel";
import { useDeliveryOptionLists } from "./useDeliveryOptionLists";

type MaterialDeliveryFormDialogProps = {
  /** Delivery to edit; omit to add a new one. */
  item?: MaterialDeliveryItem;
  /** When adding: the list's active filters pre-fill المشروع / الخامة. */
  prefill?: Pick<MaterialDeliveryFilters, "projectId" | "materialId">;
  onClose: () => void;
  /** Called after the delivery was created (also when its upload then failed). */
  onCreated?: () => void;
};

const FORM_FIELDS = [
  "authorizationNumber",
  "projectTypeId",
  "projectId",
  "billOfLadingNumber",
  "billDate",
  "quantity",
  "materialId",
  "loadingPermitNumber",
  "salesOrderNumber",
  "vehicleNumber",
  "driverName",
  "factoryId",
  "mixerId",
  "transportCompanyId",
  "receivedDate",
  "exitDate",
  "notes",
] as const;

const orNull = (value: string) => value || null;

function toRequest(values: MaterialDeliverySchemaType): SaveMaterialDeliveryRequest {
  return {
    authorizationNumber: orNull(values.authorizationNumber),
    billOfLadingNumber: orNull(values.billOfLadingNumber),
    billDate: orNull(values.billDate),
    projectTypeId: orNull(values.projectTypeId),
    projectId: values.projectId,
    materialId: values.materialId,
    quantity: parseDecimal(values.quantity) ?? 0,
    loadingPermitNumber: orNull(values.loadingPermitNumber),
    salesOrderNumber: orNull(values.salesOrderNumber),
    vehicleNumber: orNull(values.vehicleNumber),
    driverName: orNull(values.driverName),
    factoryId: orNull(values.factoryId),
    mixerId: orNull(values.mixerId),
    transportCompanyId: orNull(values.transportCompanyId),
    receivedDate: orNull(values.receivedDate),
    exitDate: orNull(values.exitDate),
    notes: orNull(values.notes),
  };
}

function savedRequestOf(item: MaterialDeliveryItem): SaveMaterialDeliveryRequest {
  return {
    authorizationNumber: item.authorizationNumber,
    billOfLadingNumber: item.billOfLadingNumber,
    billDate: item.billDate,
    projectTypeId: item.projectTypeId,
    projectId: item.projectId,
    materialId: item.materialId,
    quantity: item.quantity,
    loadingPermitNumber: item.loadingPermitNumber,
    salesOrderNumber: item.salesOrderNumber,
    vehicleNumber: item.vehicleNumber,
    driverName: item.driverName,
    factoryId: item.factoryId,
    mixerId: item.mixerId,
    transportCompanyId: item.transportCompanyId,
    receivedDate: item.receivedDate,
    exitDate: item.exitDate,
    notes: item.notes,
  };
}

function defaultValuesOf(
  item: MaterialDeliveryItem | undefined,
  prefill: MaterialDeliveryFormDialogProps["prefill"]
): MaterialDeliveryFormValues {
  return {
    authorizationNumber: item?.authorizationNumber ?? "",
    projectTypeId: item?.projectTypeId ?? "",
    projectId: item?.projectId ?? prefill?.projectId ?? "",
    billOfLadingNumber: item?.billOfLadingNumber ?? "",
    billDate: item?.billDate ?? "",
    quantity: item ? formatQuantity(item.quantity) : "",
    materialId: item?.materialId ?? prefill?.materialId ?? "",
    loadingPermitNumber: item?.loadingPermitNumber ?? "",
    salesOrderNumber: item?.salesOrderNumber ?? "",
    vehicleNumber: item?.vehicleNumber ?? "",
    driverName: item?.driverName ?? "",
    factoryId: item?.factoryId ?? "",
    mixerId: item?.mixerId ?? "",
    transportCompanyId: item?.transportCompanyId ?? "",
    receivedDate: item?.receivedDate ?? "",
    exitDate: item?.exitDate ?? "",
    notes: item?.notes ?? "",
  };
}

/**
 * Add/edit a delivery (one bill of lading / truck) with its البوليصة files (max 5), in two
 * columns on desktop. Shows the project's approved / dispensed / remaining totals for the chosen
 * material. Save (button, Enter outside the notes, or F2): create/update, then upload the new
 * files; a failed upload can be retried without creating the delivery twice. Esc closes.
 * Mount it only while open.
 */
export default function MaterialDeliveryFormDialog({
  item,
  prefill,
  onClose,
  onCreated,
}: MaterialDeliveryFormDialogProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const pickButtonRef = useRef<HTMLButtonElement>(null);
  const savingRef = useRef(false);
  const dispatch = useAppDispatch();
  const listFallbackFocusRef = useListFallbackFocus();
  const lists = useDeliveryOptionLists(item);
  useWindowFileDropGuard();

  // The delivery being edited; set after a create (ref: read synchronously by onSubmit).
  const [recordId, setRecordId] = useState<string | null>(item?.id ?? null);
  const recordIdRef = useRef<string | null>(item?.id ?? null);
  // Last values saved on the server (skip the PUT when only files are added).
  const savedRequestRef = useRef<SaveMaterialDeliveryRequest | null>(item ? savedRequestOf(item) : null);

  const { currentData: details } = useGetMaterialDeliveryQuery(recordId ?? skipToken);
  const existing = details?.attachments;
  const [removeAttachment] = useRemoveMaterialDeliveryAttachmentMutation();
  const [createRecord] = useCreateMaterialDeliveryMutation();
  const [updateRecord] = useUpdateMaterialDeliveryMutation();

  const form = useForm<MaterialDeliveryFormValues, unknown, MaterialDeliverySchemaType>({
    resolver: zodResolver(getMaterialDeliverySchema()),
    defaultValues: defaultValuesOf(item, prefill),
  });
  const { errors } = form.formState;
  const [projectId, materialId, quantity, notes] = useWatch({
    control: form.control,
    name: ["projectId", "materialId", "quantity", "notes"],
  });

  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const newFiles = usePendingFiles({
    existingCount: existing?.length ?? item?.attachmentCount ?? 0,
    maxCount: MAX_MATERIAL_DELIVERY_ATTACHMENTS,
    disabled: saving,
  });

  // ---- Save ----
  const showSaveError = (failure: ApiFailure | undefined) => {
    // 409: "رقم البوليصة مسجل من قبل" under رقم البوليصة.
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
    const reason = failure?.status === 403 ? NO_PERMISSION_MESSAGE : hasFileErrors ? null : getFailureMessage(failure);
    setUploadError(
      `تم حفظ البيانات، لكن تعذر رفع البوليصة${reason ? `: ${reason}` : "."} يمكنك إعادة المحاولة بالضغط على «حفظ».`
    );
  };

  const onSubmit = async (values: MaterialDeliverySchemaType) => {
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
          await uploadAttachments(materialDeliveryAttachmentsUrl(id), sent, { onProgress: newFiles.setProgress });
        } catch (error) {
          showUploadError(isApiFailure(error) ? error : undefined, sent);
          return;
        } finally {
          newFiles.setProgress(undefined);
          dispatch(materialDeliveryApi.util.invalidateTags(materialDeliveryAttachmentTags(id)));
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

  const isEdit = recordId !== null;
  const common = { control: form.control, disabled: saving };

  /** A number/code field: left-to-right (Arabic-Indic digits are converted on save). */
  const codeInput = (
    name: "authorizationNumber" | "billOfLadingNumber" | "loadingPermitNumber" | "salesOrderNumber" | "vehicleNumber",
    label: string,
    autoFocus = false
  ) => (
    <Input
      label={label}
      dir="ltr"
      autoComplete="off"
      data-autofocus={autoFocus || undefined}
      readOnly={saving}
      error={errors[name]?.message}
      {...form.register(name)}
    />
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "تعديل خامة مشروع" : "إضافة خامة مشروع"}
      size="xl"
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

        <DeliveryTotalsPanel projectId={projectId} materialId={materialId} excludeId={recordId} quantity={quantity} />

        {/* Two columns on desktop (the first is on the right in RTL), one on mobile. */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            {codeInput("authorizationNumber", "رقم التفويض", true)}
            <ComboboxField
              {...common}
              name="projectTypeId"
              label="نوع المشروع"
              list={lists.projectTypes}
              error={errors.projectTypeId?.message}
            />
            <ComboboxField
              {...common}
              name="projectId"
              label="المشروع"
              list={lists.projects}
              required
              error={errors.projectId?.message}
            />
            {codeInput("billOfLadingNumber", "رقم البوليصة")}
            <DateField {...common} name="billDate" label="تاريخ البوليصة" error={errors.billDate?.message} />
            <QuantityField {...common} name="quantity" label="الكمية" error={errors.quantity?.message} />
            <ComboboxField
              {...common}
              name="materialId"
              label="الخامة"
              list={lists.materials}
              required
              error={errors.materialId?.message}
            />
            {codeInput("loadingPermitNumber", "اذن التحميل")}
            {codeInput("salesOrderNumber", "رقم امر البيع")}
            {codeInput("vehicleNumber", "رقم السيارة")}
            <Input
              label="اسم السائق"
              autoComplete="off"
              readOnly={saving}
              error={errors.driverName?.message}
              {...form.register("driverName")}
            />
            <ComboboxField
              {...common}
              name="factoryId"
              label="المصنع"
              list={lists.factories}
              error={errors.factoryId?.message}
            />
          </div>

          <div className="flex flex-col gap-4">
            <ComboboxField
              {...common}
              name="mixerId"
              label="الخلاطة"
              list={lists.mixers}
              error={errors.mixerId?.message}
            />
            <ComboboxField
              {...common}
              name="transportCompanyId"
              label="شركة النقل"
              list={lists.transportCompanies}
              error={errors.transportCompanyId?.message}
            />
            <DateField {...common} name="receivedDate" label="تاريخ الاستلام" error={errors.receivedDate?.message} />
            <DateField {...common} name="exitDate" label="تاريخ الخروج" error={errors.exitDate?.message} />
            <Textarea
              label="ملاحظات"
              rows={4}
              readOnly={saving}
              error={errors.notes?.message}
              length={notes?.length ?? 0}
              maxChars={MAX_NOTES_LENGTH}
              {...form.register("notes")}
            />
            <div className="flex flex-col gap-2">
              <AttachmentUploadField
                label="البوليصة"
                files={newFiles}
                disabled={saving}
                pickButtonRef={pickButtonRef}
              />
              {recordId && existing && (
                <SavedAttachments
                  attachments={existing}
                  baseUrl={materialDeliveryAttachmentsUrl(recordId)}
                  onRemove={(attachment) => removeAttachment({ id: recordId, attachmentId: attachment.id })}
                  disabled={saving}
                  fallbackFocusRef={pickButtonRef}
                  heading={<p className="text-xs font-semibold text-muted-foreground">البوليصة المحفوظة</p>}
                />
              )}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
