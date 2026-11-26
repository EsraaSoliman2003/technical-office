"use client";

import { useId, useRef, useState, type RefObject } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AttachmentUploadField } from "@/components/attachments/AttachmentUploadField";
import { SavedAttachments } from "@/components/attachments/SavedAttachments";
import { usePendingFiles, useWindowFileDropGuard } from "@/components/attachments/usePendingFiles";
import { ContractNumberField, ContractSummaryFields, useContractSummary } from "@/components/contracts/ContractSummary";
import { ComboboxField, DateField, DecimalField, SelectField } from "@/components/form/fields";
import { FormSection, ReadOnlyField } from "@/components/form/FormSection";
import { AmountText, PercentText } from "@/components/list/cells";
import { applyServerFieldErrors, isInTopDialog, useSaveShortcut } from "@/components/list/formHelpers";
import { useListFallbackFocus } from "@/components/list/ListPage";
import { Badge, Button, Input, Modal, Textarea } from "@/components/ui";
import { uploadAttachments } from "@/lib/attachmentTransfer";
import { checkDecimal, formatAmount, parseDecimal } from "@/lib/numbers";
import {
  statementApi,
  statementAttachmentsUrl,
  statementAttachmentTags,
  useCreateStatementMutation,
  useGetStatementQuery,
  useRemoveStatementAttachmentMutation,
  useUpdateStatementMutation,
} from "@/rtk/endpoints/statementApi";
import { useAppDispatch } from "@/rtk/hooks";
import {
  STATEMENT_DATE_FIELDS,
  STATEMENT_OPTIONAL_AMOUNT_FIELDS,
  STATEMENT_TEXT_FIELDS,
  type SaveStatementRequest,
  type StatementDateField,
  type StatementItem,
  type StatementOptionalAmountField,
  type StatementTextField,
} from "@/types/statement";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE, type ApiFailure } from "@/utils/apiFailure";
import { MAX_NOTES_LENGTH } from "@/validation/codeText";
import { getStatementSchema, type StatementFormValues, type StatementSchemaType } from "@/validation/statementSchema";
import { materialsTotalOf, paymentPercentOf, STATEMENT_DATE_LABELS, STATEMENT_TEXT_LABELS } from "./labels";
import { useStatementLists } from "./useStatementLists";

type StatementFormDialogProps = {
  /** Statement to edit; omit to add a new one. */
  statement?: StatementItem;
  /** Opened from a contract: the contract is fixed (read-only). */
  contractId?: string;
  /** Focus target on close if the opening button is gone (default: the list page's). */
  fallbackFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Called after the statement was created (also when its upload then failed). */
  onCreated?: () => void;
};

const FORM_FIELDS = [
  "contractId",
  "amount",
  "executionPercent",
  "installment",
  "notes",
  ...STATEMENT_DATE_FIELDS,
  ...STATEMENT_OPTIONAL_AMOUNT_FIELDS,
  ...STATEMENT_TEXT_FIELDS,
] as const;

const orNull = (value: string) => value || null;

/** A typed amount as a number (null when empty or invalid). */
const amountOf = (text: string | undefined) => (text && checkDecimal(text, 2) === "ok" ? parseDecimal(text) : null);

const amountText = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : formatAmount(value);

function toRequest(values: StatementSchemaType): SaveStatementRequest {
  return {
    contractId: values.contractId,
    amount: parseDecimal(values.amount) ?? 0,
    executionPercent: parseDecimal(values.executionPercent),
    installment: orNull(values.installment),
    notes: orNull(values.notes),
    ...(Object.fromEntries(STATEMENT_DATE_FIELDS.map((field) => [field, orNull(values[field])])) as Record<
      StatementDateField,
      string | null
    >),
    ...(Object.fromEntries(
      STATEMENT_OPTIONAL_AMOUNT_FIELDS.map((field) => [field, parseDecimal(values[field])])
    ) as Record<StatementOptionalAmountField, number | null>),
    ...(Object.fromEntries(STATEMENT_TEXT_FIELDS.map((field) => [field, orNull(values[field])])) as Record<
      StatementTextField,
      string | null
    >),
  };
}

function savedRequestOf(statement: StatementItem): SaveStatementRequest {
  return {
    contractId: statement.contractId,
    amount: statement.amount,
    executionPercent: statement.executionPercent,
    installment: statement.installment,
    notes: statement.notes,
    ...(Object.fromEntries(STATEMENT_DATE_FIELDS.map((field) => [field, statement[field]])) as Record<
      StatementDateField,
      string | null
    >),
    ...(Object.fromEntries(STATEMENT_OPTIONAL_AMOUNT_FIELDS.map((field) => [field, statement[field]])) as Record<
      StatementOptionalAmountField,
      number | null
    >),
    ...(Object.fromEntries(STATEMENT_TEXT_FIELDS.map((field) => [field, statement[field]])) as Record<
      StatementTextField,
      string | null
    >),
  };
}

function defaultValuesOf(statement: StatementItem | undefined, contractId: string | undefined): StatementFormValues {
  return {
    contractId: statement?.contractId ?? contractId ?? "",
    amount: amountText(statement?.amount),
    executionPercent: amountText(statement?.executionPercent),
    installment: statement?.installment ?? "",
    notes: statement?.notes ?? "",
    ...(Object.fromEntries(STATEMENT_DATE_FIELDS.map((field) => [field, statement?.[field] ?? ""])) as Record<
      StatementDateField,
      string
    >),
    ...(Object.fromEntries(
      STATEMENT_OPTIONAL_AMOUNT_FIELDS.map((field) => [field, amountText(statement?.[field])])
    ) as Record<StatementOptionalAmountField, string>),
    ...(Object.fromEntries(STATEMENT_TEXT_FIELDS.map((field) => [field, statement?.[field] ?? ""])) as Record<
      StatementTextField,
      string
    >),
  };
}

/** The server's النسبة المؤوية للصرف, valid while the amount and contract are the saved ones. */
type SavedPercent = { value: number | null; amount: number; contractId: string };

/**
 * Add/edit a statement (المستخلص) in sections: بيانات العقد (from the chosen contract), حساب قيمة
 * المستخلص, مسار المستخلص, الخصومات والصرف and أخرى (with attachments). موقف المستخلص and النسبة
 * المؤوية للصرف are calculated by the server (a live preview of the percent until saved). Save
 * (button, Enter outside the text area, or F2 while this is the top dialog): create/update, then
 * upload the new files; a failed upload can be retried without creating the statement twice. Esc
 * closes. Works on its own (/statements) and on top of the contract dialog. Mount it only while open.
 */
export default function StatementFormDialog({
  statement,
  contractId: fixedContractId,
  fallbackFocusRef,
  onClose,
  onCreated,
}: StatementFormDialogProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const pickButtonRef = useRef<HTMLButtonElement>(null);
  const savingRef = useRef(false);
  const dispatch = useAppDispatch();
  const listFallbackFocusRef = useListFallbackFocus();
  const lists = useStatementLists(statement, { contracts: !fixedContractId });
  useWindowFileDropGuard();

  // The statement being edited; set after a create (ref: read synchronously by onSubmit).
  const [statementId, setStatementId] = useState<string | null>(statement?.id ?? null);
  const statementIdRef = useRef<string | null>(statement?.id ?? null);
  const savedRequestRef = useRef<SaveStatementRequest | null>(statement ? savedRequestOf(statement) : null);
  // موقف المستخلص and النسبة المؤوية للصرف: the saved values, then the server's after each save.
  const [status, setStatus] = useState<string | null>(statement?.status ?? null);
  const [savedPercent, setSavedPercent] = useState<SavedPercent | null>(
    statement ? { value: statement.paymentPercent, amount: statement.amount, contractId: statement.contractId } : null
  );

  const { currentData: details } = useGetStatementQuery(statementId ?? skipToken);
  const existing = details?.attachments;
  const [removeAttachment] = useRemoveStatementAttachmentMutation();
  const [createStatement] = useCreateStatementMutation();
  const [updateStatement] = useUpdateStatementMutation();

  const form = useForm<StatementFormValues, unknown, StatementSchemaType>({
    resolver: zodResolver(getStatementSchema()),
    defaultValues: defaultValuesOf(statement, fixedContractId),
  });
  const { errors } = form.formState;
  const [contractId, amount, ironValue, cementValue, notes] = useWatch({
    control: form.control,
    name: ["contractId", "amount", "ironValue", "cementValue", "notes"],
  });

  // ---- بيانات العقد: from the chosen contract (the edited statement's own copy until it loads) ----
  const contractInfo = useContractSummary(contractId, statement);

  // ---- Live values ----
  const amountValue = amountOf(amount);
  const percent =
    savedPercent && savedPercent.amount === amountValue && savedPercent.contractId === contractId
      ? savedPercent.value
      : paymentPercentOf(amountValue, contractInfo.value);
  const materialsTotal = materialsTotalOf(amountOf(ironValue), amountOf(cementValue));

  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const newFiles = usePendingFiles({
    existingCount: existing?.length ?? statement?.attachmentCount ?? 0,
    disabled: saving,
  });

  // ---- Save ----
  const showSaveError = (failure: ApiFailure | undefined) => {
    if (failure?.status === 400) {
      // With a fixed contract, رقم العقد is read-only text (no error slot): show its error (e.g. the contract was
      // deleted meanwhile) as a toast instead of on the hidden field.
      const contractError = fixedContractId
        ? Object.entries(failure.fieldErrors).find(([key]) => key.toLowerCase() === "contractid")?.[1]?.[0]
        : undefined;
      if (contractError) toast.error(contractError);
      const fields = fixedContractId ? FORM_FIELDS.filter((field) => field !== "contractId") : FORM_FIELDS;
      const shown = applyServerFieldErrors(failure, fields, (field, message, focus) =>
        form.setError(field, { type: "server", message }, { shouldFocus: focus })
      );
      if (shown || contractError) return;
    }
    // 404: the statement (or its contract) was deleted meanwhile; refresh the tables.
    const id = statementIdRef.current;
    if (failure?.status === 404 && id) dispatch(statementApi.util.invalidateTags(statementAttachmentTags(id)));
    toast.error(failure?.status === 403 ? NO_PERMISSION_MESSAGE : getFailureMessage(failure));
  };

  const showUploadError = (failure: ApiFailure | undefined, sent: File[]) => {
    const hasFileErrors = newFiles.showServerErrors(failure, sent);
    const reason = failure?.status === 403 ? NO_PERMISSION_MESSAGE : hasFileErrors ? null : getFailureMessage(failure);
    setUploadError(
      `تم حفظ بيانات المستخلص، لكن تعذر رفع المرفقات${reason ? `: ${reason}` : "."} يمكنك إعادة المحاولة بالضغط على «حفظ».`
    );
  };

  const onSubmit = async (values: StatementSchemaType) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setUploadError(null);
    try {
      const request = toRequest(values);
      let id = statementIdRef.current;

      if (!id || JSON.stringify(request) !== JSON.stringify(savedRequestRef.current)) {
        const result = id ? await updateStatement({ id, body: request }) : await createStatement(request);
        if ("error" in result) {
          showSaveError(isApiFailure(result.error) ? result.error : undefined);
          return;
        }
        savedRequestRef.current = request;
        setStatus(result.data.status);
        setSavedPercent({ value: result.data.paymentPercent, amount: request.amount, contractId: request.contractId });
        if (!id) {
          id = result.data.id;
          statementIdRef.current = id;
          setStatementId(id);
          onCreated?.();
        }
      }

      if (newFiles.files.length > 0) {
        newFiles.setProgress(0);
        const sent = newFiles.files;
        try {
          await uploadAttachments(statementAttachmentsUrl(id), sent, { onProgress: newFiles.setProgress });
        } catch (error) {
          showUploadError(isApiFailure(error) ? error : undefined, sent);
          return;
        } finally {
          newFiles.setProgress(undefined);
          dispatch(statementApi.util.invalidateTags(statementAttachmentTags(id)));
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

  // Only while this is the top dialog (not under a confirmation, and not under it the contract dialog).
  useSaveShortcut(() => {
    if (!savingRef.current && isInTopDialog(formRef.current)) formRef.current?.requestSubmit();
  });

  const isEdit = statementId !== null;
  const common = { control: form.control, disabled: saving };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "تعديل مستخلص" : "إضافة مستخلص"}
      size="xl"
      preventClose={saving}
      fallbackFocusRef={fallbackFocusRef ?? listFallbackFocusRef}
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

        <FormSection title="بيانات العقد">
          <ContractSummaryFields
            summary={contractInfo}
            contractField={
              fixedContractId ? (
                <ContractNumberField summary={contractInfo} />
              ) : (
                <ComboboxField
                  {...common}
                  name="contractId"
                  label="رقم العقد"
                  list={lists.contracts}
                  required
                  error={errors.contractId?.message}
                />
              )
            }
          />
        </FormSection>

        <FormSection title="حساب قيمة المستخلص">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DecimalField
              {...common}
              name="amount"
              label="قيمة المستخلص"
              decimals={2}
              required
              error={errors.amount?.message}
            />
            <DecimalField
              {...common}
              name="executionPercent"
              label="نسبة التنفيذ %"
              decimals={2}
              error={errors.executionPercent?.message}
            />
            <ReadOnlyField label="النسبة المؤوية للصرف">
              <span className="font-semibold text-foreground">
                <PercentText value={percent} />
              </span>
            </ReadOnlyField>
            <SelectField
              {...common}
              name="installment"
              label="دفعة"
              list={lists.installments}
              emptyLabel="بدون"
              error={errors.installment?.message}
            />
            {(["officerRank", "officerName"] as const).map((field) => (
              <Input
                key={field}
                label={STATEMENT_TEXT_LABELS[field]}
                autoComplete="off"
                readOnly={saving}
                error={errors[field]?.message}
                {...form.register(field)}
              />
            ))}
          </div>
        </FormSection>

        <FormSection title="مسار المستخلص">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STATEMENT_DATE_FIELDS.map((field) => (
              <DateField
                key={field}
                {...common}
                name={field}
                label={STATEMENT_DATE_LABELS[field]}
                error={errors[field]?.message}
              />
            ))}
            <ReadOnlyField label="موقف المستخلص">
              {status ? (
                <Badge variant="primary">{lists.statuses.nameOf(status) ?? status}</Badge>
              ) : (
                <span className="text-muted-foreground">يُحسب بعد الحفظ</span>
              )}
            </ReadOnlyField>
          </div>
        </FormSection>

        <FormSection title="الخصومات والصرف">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DecimalField {...common} name="ironValue" label="الحديد" decimals={2} error={errors.ironValue?.message} />
            <DecimalField
              {...common}
              name="cementValue"
              label="الاسمنت"
              decimals={2}
              error={errors.cementValue?.message}
            />
            <ReadOnlyField label="اجمالي الخامات">
              <span className="font-semibold text-foreground">
                <AmountText value={materialsTotal} />
              </span>
            </ReadOnlyField>
            <DecimalField
              {...common}
              name="netPayment"
              label="صافي الصرف"
              decimals={2}
              error={errors.netPayment?.message}
            />
          </div>
        </FormSection>

        <FormSection title="أخرى">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(["insuranceStatus", "centralLetter", "coding"] as const).map((field) => (
              <Input
                key={field}
                label={STATEMENT_TEXT_LABELS[field]}
                autoComplete="off"
                readOnly={saving}
                error={errors[field]?.message}
                {...form.register(field)}
              />
            ))}
          </div>
          <Textarea
            label="ملاحظات"
            rows={2}
            readOnly={saving}
            error={errors.notes?.message}
            length={notes?.length ?? 0}
            maxChars={MAX_NOTES_LENGTH}
            {...form.register("notes")}
          />
          <div className="flex flex-col gap-2">
            <AttachmentUploadField label="المرفقات" files={newFiles} disabled={saving} pickButtonRef={pickButtonRef} />
            {statementId && existing && (
              <SavedAttachments
                attachments={existing}
                baseUrl={statementAttachmentsUrl(statementId)}
                onRemove={(attachment) => removeAttachment({ id: statementId, attachmentId: attachment.id })}
                disabled={saving}
                fallbackFocusRef={pickButtonRef}
                heading={<p className="text-xs font-semibold text-muted-foreground">المرفقات المحفوظة</p>}
              />
            )}
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
