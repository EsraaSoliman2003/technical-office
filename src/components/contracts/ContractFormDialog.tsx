"use client";

import { useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { CategoryAttachmentsField, uploadCategoryFiles } from "@/components/attachments/categories";
import { usePendingFiles, useWindowFileDropGuard, type PendingFiles } from "@/components/attachments/usePendingFiles";
import { ComboboxField, DateField, DecimalField, SelectField } from "@/components/form/fields";
import { applyServerFieldErrors, isInTopDialog, useSaveShortcut } from "@/components/list/formHelpers";
import { useListFallbackFocus } from "@/components/list/ListPage";
import { Badge, Button, Input, Modal, Textarea } from "@/components/ui";
import { checkDecimal, formatAmount, parseDecimal } from "@/lib/numbers";
import {
  contractApi,
  contractAttachmentsUrl,
  contractAttachmentTags,
  useCreateContractMutation,
  useGetContractQuery,
  useRemoveContractAttachmentMutation,
  useUpdateContractMutation,
} from "@/rtk/endpoints/contractApi";
import { useAppDispatch } from "@/rtk/hooks";
import {
  CONTRACT_DATE_FIELDS,
  CONTRACT_VALUE_FIELDS,
  type ContractAttachmentCategory,
  type ContractFilters,
  type ContractItem,
  type ContractValueField,
  type SaveContractRequest,
} from "@/types/contract";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE, type ApiFailure } from "@/utils/apiFailure";
import { MAX_NOTES_LENGTH } from "@/validation/codeText";
import {
  getContractSchema,
  MAX_CONTRACT_NAME_LENGTH,
  MAX_RETURN_REASON_LENGTH,
  type ContractFormValues,
  type ContractSchemaType,
} from "@/validation/contractSchema";
import {
  CONTRACT_ATTACHMENT_CATEGORIES,
  CONTRACT_ATTACHMENT_LABELS,
  CONTRACT_DATE_LABELS,
  CONTRACT_VALUE_LABELS,
  contractValueOf,
} from "./labels";
import { useContractLists } from "./useContractLists";

type ContractFormDialogProps = {
  /** Contract to edit; omit to add a new one. */
  contract?: ContractItem;
  /** When adding: the list's active filters pre-fill المشروع / الشركة. */
  prefill?: Pick<ContractFilters, "projectId" | "companyId">;
  onClose: () => void;
  /** Called after the contract was created (also when an upload then failed). */
  onCreated?: () => void;
};

const FORM_FIELDS = [
  "contractNumber",
  "name",
  "projectTypeId",
  "projectId",
  "companyId",
  "stage",
  "notes",
  "returnReason",
  ...CONTRACT_DATE_FIELDS,
  ...CONTRACT_VALUE_FIELDS,
] as const;

const orNull = (value: string) => value || null;

function toRequest(values: ContractSchemaType): SaveContractRequest {
  return {
    contractNumber: values.contractNumber,
    name: values.name,
    projectTypeId: orNull(values.projectTypeId),
    projectId: values.projectId,
    companyId: values.companyId,
    stage: orNull(values.stage),
    notes: orNull(values.notes),
    returnReason: orNull(values.returnReason),
    ...(Object.fromEntries(CONTRACT_DATE_FIELDS.map((field) => [field, orNull(values[field])])) as Pick<
      SaveContractRequest,
      (typeof CONTRACT_DATE_FIELDS)[number]
    >),
    ...(Object.fromEntries(CONTRACT_VALUE_FIELDS.map((field) => [field, parseDecimal(values[field])])) as Pick<
      SaveContractRequest,
      ContractValueField
    >),
  };
}

function savedRequestOf(contract: ContractItem): SaveContractRequest {
  return {
    contractNumber: contract.contractNumber,
    name: contract.name,
    projectTypeId: contract.projectTypeId,
    projectId: contract.projectId,
    companyId: contract.companyId,
    stage: contract.stage,
    notes: contract.notes,
    returnReason: contract.returnReason,
    ...(Object.fromEntries(CONTRACT_DATE_FIELDS.map((field) => [field, contract[field]])) as Pick<
      SaveContractRequest,
      (typeof CONTRACT_DATE_FIELDS)[number]
    >),
    ...(Object.fromEntries(CONTRACT_VALUE_FIELDS.map((field) => [field, contract[field]])) as Pick<
      SaveContractRequest,
      ContractValueField
    >),
  };
}

function defaultValuesOf(
  contract: ContractItem | undefined,
  prefill: ContractFormDialogProps["prefill"]
): ContractFormValues {
  return {
    contractNumber: contract?.contractNumber ?? "",
    name: contract?.name ?? "",
    projectTypeId: contract?.projectTypeId ?? "",
    projectId: contract?.projectId ?? prefill?.projectId ?? "",
    companyId: contract?.companyId ?? prefill?.companyId ?? "",
    stage: contract?.stage ?? "",
    notes: contract?.notes ?? "",
    returnReason: contract?.returnReason ?? "",
    ...(Object.fromEntries(CONTRACT_DATE_FIELDS.map((field) => [field, contract?.[field] ?? ""])) as Pick<
      ContractFormValues,
      (typeof CONTRACT_DATE_FIELDS)[number]
    >),
    ...(Object.fromEntries(
      CONTRACT_VALUE_FIELDS.map((field) => {
        const value = contract?.[field];
        return [field, value === null || value === undefined ? "" : formatAmount(value)];
      })
    ) as Pick<ContractFormValues, ContractValueField>),
  };
}

/** A titled part of the form (بيانات العقد / التواريخ / القيم / المرفقات). */
function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h3 id={id} className="flex items-center gap-2 border-b border-border pb-2 text-sm font-bold text-foreground">
        <span className="h-2 w-2 rotate-45 bg-accent" aria-hidden="true" />
        {title}
      </h3>
      {children}
    </section>
  );
}

/** A read-only value shown like a field (موقف العقد, قيمة العقد). */
function ReadOnlyField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div className="flex h-11 items-center rounded-lg border border-dashed border-border bg-surface-muted/60 px-3 text-sm">
        {children}
      </div>
    </div>
  );
}

/** A typed amount as a number for the preview (null when empty or invalid). */
const amountOf = (text: string | undefined) => (text && checkDecimal(text, 2) === "ok" ? parseDecimal(text) : null);

/**
 * Add/edit a contract (phase 1: the contract core) in sections: بيانات العقد, التواريخ, القيم and
 * المرفقات (three categories). موقف العقد is read-only: the server calculates it from the dates
 * (shown after save). Save (button, Enter outside the text areas, or F2): create/update, then
 * upload each category's new files; a failed upload can be retried without creating the contract
 * twice. Esc closes. Mount it only while open.
 */
export default function ContractFormDialog({ contract, prefill, onClose, onCreated }: ContractFormDialogProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const savingRef = useRef(false);
  const dispatch = useAppDispatch();
  const listFallbackFocusRef = useListFallbackFocus();
  const lists = useContractLists(contract);
  useWindowFileDropGuard();

  // The contract being edited; set after a create (ref: read synchronously by onSubmit).
  const [contractId, setContractId] = useState<string | null>(contract?.id ?? null);
  const contractIdRef = useRef<string | null>(contract?.id ?? null);
  const savedRequestRef = useRef<SaveContractRequest | null>(contract ? savedRequestOf(contract) : null);
  // موقف العقد: the saved value, then the server's new value after each save.
  const [status, setStatus] = useState<string | null>(contract?.status ?? null);

  const { currentData: details } = useGetContractQuery(contractId ?? skipToken);
  const [removeAttachment] = useRemoveContractAttachmentMutation();
  const [createContract] = useCreateContractMutation();
  const [updateContract] = useUpdateContractMutation();

  const form = useForm<ContractFormValues, unknown, ContractSchemaType>({
    resolver: zodResolver(getContractSchema()),
    defaultValues: defaultValuesOf(contract, prefill),
  });
  const { errors } = form.formState;
  const [name, notes, returnReason, battalionValue, managementValue, authorityValue] = useWatch({
    control: form.control,
    name: ["name", "notes", "returnReason", "battalionValue", "managementValue", "authorityValue"],
  });
  const previewValue = contractValueOf({
    battalionValue: amountOf(battalionValue),
    managementValue: amountOf(managementValue),
    authorityValue: amountOf(authorityValue),
  });

  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ---- Attachments (three categories, max 10 each) ----
  const existingOf = (category: ContractAttachmentCategory) =>
    details?.attachments.filter((attachment) => attachment.category === category);
  const existingCount = (category: ContractAttachmentCategory) =>
    existingOf(category)?.length ?? contract?.attachmentCounts[category] ?? 0;
  const consultantReviewFiles = usePendingFiles({ existingCount: existingCount("consultantReview"), disabled: saving });
  const approvedQuantitiesFiles = usePendingFiles({
    existingCount: existingCount("approvedQuantities"),
    disabled: saving,
  });
  const irSubmittalFiles = usePendingFiles({ existingCount: existingCount("irSubmittal"), disabled: saving });
  const filesOf: Record<ContractAttachmentCategory, PendingFiles> = {
    consultantReview: consultantReviewFiles,
    approvedQuantities: approvedQuantitiesFiles,
    irSubmittal: irSubmittalFiles,
  };
  const consultantReviewPickRef = useRef<HTMLButtonElement>(null);
  const approvedQuantitiesPickRef = useRef<HTMLButtonElement>(null);
  const irSubmittalPickRef = useRef<HTMLButtonElement>(null);
  const pickRefOf: Record<ContractAttachmentCategory, RefObject<HTMLButtonElement | null>> = {
    consultantReview: consultantReviewPickRef,
    approvedQuantities: approvedQuantitiesPickRef,
    irSubmittal: irSubmittalPickRef,
  };

  // ---- Save ----
  const showSaveError = (failure: ApiFailure | undefined) => {
    // 409: "رقم العقد مسجل من قبل" under رقم العقد.
    if (failure && (failure.status === 400 || failure.status === 409)) {
      const shown = applyServerFieldErrors(failure, FORM_FIELDS, (field, message, focus) =>
        form.setError(field, { type: "server", message }, { shouldFocus: focus })
      );
      if (shown) return;
    }
    toast.error(failure?.status === 403 ? NO_PERMISSION_MESSAGE : getFailureMessage(failure));
  };

  const onSubmit = async (values: ContractSchemaType) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setUploadError(null);
    try {
      const request = toRequest(values);
      let id = contractIdRef.current;

      if (!id || JSON.stringify(request) !== JSON.stringify(savedRequestRef.current)) {
        const result = id ? await updateContract({ id, body: request }) : await createContract(request);
        if ("error" in result) {
          showSaveError(isApiFailure(result.error) ? result.error : undefined);
          return;
        }
        savedRequestRef.current = request;
        setStatus(result.data.status);
        if (!id) {
          id = result.data.id;
          contractIdRef.current = id;
          setContractId(id);
          onCreated?.();
        }
      }

      const failures = await uploadCategoryFiles({
        url: contractAttachmentsUrl(id),
        categories: CONTRACT_ATTACHMENT_CATEGORIES,
        filesOf,
        labels: CONTRACT_ATTACHMENT_LABELS,
      });
      dispatch(contractApi.util.invalidateTags(contractAttachmentTags(id)));
      if (failures.length > 0) {
        setUploadError(
          `تم حفظ بيانات العقد، لكن تعذر رفع مرفقات: ${failures.join("، ")}. يمكنك إعادة المحاولة بالضغط على «حفظ».`
        );
        return;
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

  const isEdit = contractId !== null;
  const common = { control: form.control, disabled: saving };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "تعديل عقد" : "إضافة عقد"}
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
        className="space-y-6"
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

        <Section title="بيانات العقد">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="رقم العقد"
              required
              dir="ltr"
              autoComplete="off"
              data-autofocus
              readOnly={saving}
              error={errors.contractNumber?.message}
              {...form.register("contractNumber")}
            />
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
              label="اسم المشروع"
              list={lists.projects}
              required
              error={errors.projectId?.message}
            />
            <ComboboxField
              {...common}
              name="companyId"
              label="الشركة المنفذة"
              list={lists.companies}
              required
              error={errors.companyId?.message}
            />
            <SelectField
              {...common}
              name="stage"
              label="مرحلة العقد"
              list={lists.stages}
              emptyLabel="بدون"
              error={errors.stage?.message}
            />
            <ReadOnlyField label="موقف العقد">
              {status ? (
                <Badge variant="primary">{lists.statuses.nameOf(status) ?? status}</Badge>
              ) : (
                <span className="text-muted-foreground">يُحسب من التواريخ بعد الحفظ</span>
              )}
            </ReadOnlyField>
          </div>
          <Textarea
            label="اسم العقد"
            required
            rows={2}
            readOnly={saving}
            error={errors.name?.message}
            length={name?.length ?? 0}
            maxChars={MAX_CONTRACT_NAME_LENGTH}
            {...form.register("name")}
          />
          <Textarea
            label="ملاحظات"
            rows={2}
            readOnly={saving}
            error={errors.notes?.message}
            length={notes?.length ?? 0}
            maxChars={MAX_NOTES_LENGTH}
            {...form.register("notes")}
          />
        </Section>

        <Section title="التواريخ">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONTRACT_DATE_FIELDS.map((field) => (
              <div key={field} className="contents">
                <DateField
                  {...common}
                  name={field}
                  label={CONTRACT_DATE_LABELS[field]}
                  error={errors[field]?.message}
                />
                {field === "authorityReturnForCompletionDate" && (
                  <Textarea
                    label="سبب الرجوع (استيفاء)"
                    rows={2}
                    readOnly={saving}
                    error={errors.returnReason?.message}
                    length={returnReason?.length ?? 0}
                    maxChars={MAX_RETURN_REASON_LENGTH}
                    containerClassName="sm:col-span-1 lg:col-span-2"
                    {...form.register("returnReason")}
                  />
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section title="القيم">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONTRACT_VALUE_FIELDS.map((field) => (
              <DecimalField
                key={field}
                {...common}
                name={field}
                label={CONTRACT_VALUE_LABELS[field]}
                decimals={2}
                error={errors[field]?.message}
              />
            ))}
            <ReadOnlyField label="قيمة العقد">
              <span dir="ltr" className="font-bold text-foreground tabular-nums">
                {previewValue === null ? "—" : formatAmount(previewValue)}
              </span>
            </ReadOnlyField>
          </div>
          <p className="text-xs text-muted-foreground">
            قيمة العقد = قيمة الهيئة، وإلا قيمة الادارة، وإلا قيمة الكتيبة.
          </p>
        </Section>

        <Section title="المرفقات">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {CONTRACT_ATTACHMENT_CATEGORIES.map((category) => (
              <CategoryAttachmentsField
                key={category}
                label={CONTRACT_ATTACHMENT_LABELS[category]}
                files={filesOf[category]}
                pickButtonRef={pickRefOf[category]}
                existing={existingOf(category)}
                baseUrl={contractId ? contractAttachmentsUrl(contractId) : null}
                onRemove={(attachment) => removeAttachment({ id: contractId ?? "", attachmentId: attachment.id })}
                disabled={saving}
              />
            ))}
          </div>
        </Section>
      </form>
    </Modal>
  );
}
