"use client";

import { useId, useRef, useState, type RefObject } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { AlertTriangle, FileSearch } from "lucide-react";
import { toast } from "sonner";
import { ContractNumberField, ContractSummaryFields, useContractSummary } from "@/components/contracts/ContractSummary";
import { ComboboxField, DateField, DecimalField, SelectField } from "@/components/form/fields";
import { FormSection, ReadOnlyField } from "@/components/form/FormSection";
import { AmountText, PercentText } from "@/components/list/cells";
import { applyServerFieldErrors, isInTopDialog, useSaveShortcut } from "@/components/list/formHelpers";
import { useListFallbackFocus } from "@/components/list/ListPage";
import { useLabeledList, useOptionList } from "@/components/options/useOptionList";
import { Button, Input, Modal } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatAmount, formatQuantity, parseDecimal } from "@/lib/numbers";
import {
  advanceSheetApi,
  advanceSheetGoneTags,
  useAdvanceSheetMetaQuery,
  useCreateAdvanceSheetMutation,
  useGetContractAdvanceSheetQuery,
  useUpdateAdvanceSheetMutation,
} from "@/rtk/endpoints/advanceSheetApi";
import { useContractOptionsQuery } from "@/rtk/endpoints/contractApi";
import { useAppDispatch } from "@/rtk/hooks";
import {
  ADVANCE_SHEET_CALCULATED_FIELDS,
  ADVANCE_SHEET_MONEY_FIELDS,
  ADVANCE_SHEET_QUANTITY_FIELDS,
  type AdvanceSheetItem,
  type AdvanceSheetMoneyField,
  type AdvanceSheetQuantityField,
  type SaveAdvanceSheetRequest,
} from "@/types/advanceSheet";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE, type ApiFailure } from "@/utils/apiFailure";
import {
  getAdvanceSheetSchema,
  type AdvanceSheetFormValues,
  type AdvanceSheetSchemaType,
} from "@/validation/advanceSheetSchema";
import { calculateAdvance, type AdvanceResults } from "./calc";
import { ADVANCE_CALC_ROWS, type AdvanceCalcRow } from "./labels";

type AdvanceSheetFormDialogProps = {
  /** Sheet to edit (its contract can't change); omit to add a new one. */
  sheet?: AdvanceSheetItem;
  /** Adding from a contract: the contract is fixed (read-only). */
  contractId?: string;
  /** Focus target on close if the opening button is gone (default: the list page's). */
  fallbackFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Called after a sheet was created. */
  onCreated?: () => void;
  /** Called with the server's sheet after each save (e.g. the contract dialog takes its new قيمة السلفة). */
  onSaved?: (sheet: AdvanceSheetItem) => void;
  /** Adding, and the chosen contract already has a sheet: open that one instead. */
  onOpenExisting?: (sheet: AdvanceSheetItem) => void;
};

const FORM_FIELDS = [
  "contractId",
  "executionPercent",
  "siteReceiptDate",
  "prices",
  "executionDuration",
  ...ADVANCE_SHEET_MONEY_FIELDS,
  ...ADVANCE_SHEET_QUANTITY_FIELDS,
] as const;

const orNull = (value: string) => value || null;
const textOf = (value: number | null | undefined, format: (value: number) => string) =>
  value === null || value === undefined ? "" : format(value);

/** The save body from the field texts (also used, unvalidated, to tell whether the form still matches the save). */
function toRequest(values: AdvanceSheetFormValues): SaveAdvanceSheetRequest {
  return {
    contractId: values.contractId,
    executionPercent: parseDecimal(values.executionPercent),
    siteReceiptDate: orNull(values.siteReceiptDate),
    prices: orNull(values.prices),
    executionDuration: orNull((values.executionDuration ?? "").trim()),
    ...(Object.fromEntries(ADVANCE_SHEET_MONEY_FIELDS.map((field) => [field, parseDecimal(values[field])])) as Record<
      AdvanceSheetMoneyField,
      number | null
    >),
    ...(Object.fromEntries(
      ADVANCE_SHEET_QUANTITY_FIELDS.map((field) => [field, parseDecimal(values[field])])
    ) as Record<AdvanceSheetQuantityField, number | null>),
  };
}

function defaultValuesOf(sheet: AdvanceSheetItem | undefined, contractId: string | undefined): AdvanceSheetFormValues {
  return {
    contractId: sheet?.contractId ?? contractId ?? "",
    executionPercent: textOf(sheet?.executionPercent, formatAmount),
    siteReceiptDate: sheet?.siteReceiptDate ?? "",
    prices: sheet?.prices ?? "",
    executionDuration: sheet?.executionDuration ?? "",
    ...(Object.fromEntries(
      ADVANCE_SHEET_MONEY_FIELDS.map((field) => [field, textOf(sheet?.[field], formatAmount)])
    ) as Record<AdvanceSheetMoneyField, string>),
    ...(Object.fromEntries(
      ADVANCE_SHEET_QUANTITY_FIELDS.map((field) => [field, textOf(sheet?.[field], formatQuantity)])
    ) as Record<AdvanceSheetQuantityField, string>),
  };
}

/** The server's calculated values, valid while the form and the contract value are as saved. */
type SavedResults = { key: string; contractValue: number | null | undefined; results: AdvanceResults };

function savedResultsOf(sheet: AdvanceSheetItem): SavedResults {
  const results = Object.fromEntries(ADVANCE_SHEET_CALCULATED_FIELDS.map((field) => [field, sheet[field]])) as Omit<
    AdvanceResults,
    "exceedsAllowed" | "allowedNegative"
  >;
  return {
    key: JSON.stringify(requestOfSheet(sheet)),
    contractValue: sheet.contractValue,
    results: {
      ...results,
      exceedsAllowed: sheet.exceedsAllowed,
      allowedNegative: sheet.maxAllowedRequest !== null && sheet.maxAllowedRequest < 0,
    },
  };
}

function requestOfSheet(sheet: AdvanceSheetItem): SaveAdvanceSheetRequest {
  return toRequest(defaultValuesOf(sheet, undefined));
}

/** A calculated value (read-only, grey): money or a percentage, "—" when it can't be calculated. */
function CalcValue({ label, value, percent }: { label: string; value: number | null; percent?: boolean }) {
  return (
    <ReadOnlyField label={label}>
      <span className={cn("font-semibold", value !== null && value < 0 ? "text-danger" : "text-foreground")}>
        {percent ? <PercentText value={value} /> : <AmountText value={value} />}
      </span>
    </ReadOnlyField>
  );
}

/**
 * Add/edit an advance sheet (حساب قيمة السلفة) in the old layout: بيانات العقد, حساب قيمة السلفة (two
 * columns, inputs white and calculated values grey, with a live preview; the server's values after
 * save) and بيانات عامة. A contract has one sheet: when adding, a contract that already has one
 * offers to open it (and the server answers 409). Save (button, Enter or F2 while this is the top
 * dialog). Esc closes. Works on /advances and on top of the contract dialog. Mount it only while open.
 */
export default function AdvanceSheetFormDialog({
  sheet,
  contractId: fixedContractId,
  fallbackFocusRef,
  onClose,
  onCreated,
  onSaved,
  onOpenExisting,
}: AdvanceSheetFormDialogProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const savingRef = useRef(false);
  const dispatch = useAppDispatch();
  const listFallbackFocusRef = useListFallbackFocus();
  const isEdit = sheet !== undefined;
  const contractLocked = isEdit || Boolean(fixedContractId);

  const meta = useAdvanceSheetMetaQuery();
  const prices = useLabeledList(meta.currentData?.prices, meta.isLoading, meta.isError);
  const contracts = useOptionList(useContractOptionsQuery(undefined, { skip: contractLocked }));
  const [createSheet] = useCreateAdvanceSheetMutation();
  const [updateSheet] = useUpdateAdvanceSheetMutation();

  const form = useForm<AdvanceSheetFormValues, unknown, AdvanceSheetSchemaType>({
    resolver: zodResolver(getAdvanceSheetSchema()),
    defaultValues: defaultValuesOf(sheet, fixedContractId),
  });
  const { errors } = form.formState;
  const values = useWatch({ control: form.control }) as AdvanceSheetFormValues;
  const contractId = values.contractId ?? "";

  // ---- بيانات العقد ----
  const summary = useContractSummary(contractId, sheet);
  // Adding: does the chosen contract already have a sheet? (200 = yes, 404 = no)
  const { currentData: existingSheet } = useGetContractAdvanceSheetQuery(
    !isEdit && contractId ? contractId : skipToken
  );

  // ---- حساب قيمة السلفة: live, or the server's values while nothing changed since the save ----
  const [savedResults] = useState<SavedResults | null>(() => (sheet ? savedResultsOf(sheet) : null));
  const live = calculateAdvance({ ...values, contractValue: summary.value, rates: meta.currentData?.rates });
  const results =
    savedResults &&
    savedResults.key === JSON.stringify(toRequest(values)) &&
    (summary.value === undefined || summary.value === savedResults.contractValue)
      ? savedResults.results
      : live;
  const statementsTotal = summary.contract?.statementsTotal;

  const [saving, setSaving] = useState(false);
  // The sheet being edited; set after a create (ref: read synchronously by onSubmit).
  const sheetIdRef = useRef<string | null>(sheet?.id ?? null);

  // ---- Save ----
  const showSaveError = (failure: ApiFailure | undefined) => {
    if (failure && (failure.status === 400 || failure.status === 409)) {
      // 409 "توجد سلفة مسجلة لهذا العقد" goes under رقم العقد; while the contract is locked (no error
      // slot), its message is a toast.
      const contractError = contractLocked
        ? Object.entries(failure.fieldErrors).find(([key]) => key.toLowerCase() === "contractid")?.[1]?.[0]
        : undefined;
      if (contractError) toast.error(contractError);
      const fields = contractLocked ? FORM_FIELDS.filter((field) => field !== "contractId") : FORM_FIELDS;
      const shown = applyServerFieldErrors(
        failure,
        fields,
        (field, message, focus) => form.setError(field, { type: "server", message }, { shouldFocus: focus }),
        // A 409 without field keys: under رقم العقد when it can show there.
        failure.status === 409 && !contractLocked ? "contractId" : undefined
      );
      if (shown || contractError) return;
    }
    // 404: the sheet (or its contract) was deleted meanwhile; refresh.
    const id = sheetIdRef.current;
    if (failure?.status === 404 && id)
      dispatch(advanceSheetApi.util.invalidateTags(advanceSheetGoneTags(contractId, id)));
    toast.error(failure?.status === 403 ? NO_PERMISSION_MESSAGE : getFailureMessage(failure));
  };

  const onSubmit = async (validated: AdvanceSheetSchemaType) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const request = toRequest(validated);
      const id = sheetIdRef.current;
      const result = id ? await updateSheet({ id, body: request }) : await createSheet(request);
      if ("error" in result) {
        showSaveError(isApiFailure(result.error) ? result.error : undefined);
        return;
      }
      if (!id) {
        sheetIdRef.current = result.data.id;
        onCreated?.();
      }
      onSaved?.(result.data);
      toast.success("تم الحفظ بنجاح");
      onClose();
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // Only while this is the top dialog (e.g. not under the contract dialog's confirmation).
  useSaveShortcut(() => {
    if (!savingRef.current && isInTopDialog(formRef.current)) formRef.current?.requestSubmit();
  });

  const common = { control: form.control, disabled: saving };

  const renderRow = (row: AdvanceCalcRow) => {
    switch (row.kind) {
      case "calc":
        return <CalcValue key={row.field} label={row.label} value={results[row.field]} percent={row.percent} />;
      case "percentInput":
        return (
          <DecimalField
            key={row.field}
            {...common}
            name={row.field}
            label={row.label}
            decimals={2}
            error={errors.executionPercent?.message}
          />
        );
      case "quantity":
        return (
          <DecimalField
            key={row.field}
            {...common}
            name={row.field}
            label={row.label}
            decimals={3}
            error={errors[row.field]?.message}
          />
        );
      case "money":
        if (row.field !== "statementsSpent") {
          return (
            <DecimalField
              key={row.field}
              {...common}
              name={row.field}
              label={row.label}
              decimals={2}
              error={errors[row.field]?.message}
            />
          );
        }
        // المنصرف على العقد: "من المستخلصات" fills it with the contract's statements total (still editable).
        return (
          <div key={row.field} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <DecimalField
                {...common}
                name={row.field}
                label={row.label}
                decimals={2}
                error={errors.statementsSpent?.message}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={saving || statementsTotal === undefined}
              onClick={() =>
                form.setValue("statementsSpent", formatAmount(statementsTotal ?? 0), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              title="تعبئة بإجمالي مستخلصات العقد"
              className={cn("h-11 shrink-0", errors.statementsSpent && "mb-6")}
            >
              من المستخلصات
            </Button>
          </div>
        );
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "تعديل سلفة" : "إضافة سلفة"}
      description="حساب قيمة السلفة"
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
        <FormSection title="بيانات العقد">
          <ContractSummaryFields
            summary={summary}
            valueLabel="قيمة المشروع"
            contractField={
              contractLocked ? (
                <ContractNumberField summary={summary} />
              ) : (
                <ComboboxField
                  {...common}
                  name="contractId"
                  label="رقم العقد"
                  list={contracts}
                  required
                  error={errors.contractId?.message}
                />
              )
            }
          />
          {existingSheet && (
            <div
              role="status"
              className="flex flex-wrap items-center gap-3 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2.5 text-sm text-accent-text"
            >
              <AlertTriangle size={18} aria-hidden="true" className="shrink-0" />
              <span className="font-semibold">توجد سلفة لهذا العقد</span>
              {onOpenExisting && (
                <Button size="sm" variant="secondary" onClick={() => onOpenExisting(existingSheet)} disabled={saving}>
                  <FileSearch size={16} aria-hidden="true" />
                  فتح السلفة
                </Button>
              )}
            </div>
          )}
        </FormSection>

        <FormSection title="حساب قيمة السلفة">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{ADVANCE_CALC_ROWS.map(renderRow)}</div>
          {(results.exceedsAllowed || results.allowedNegative) && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2.5 text-sm text-accent-text"
            >
              <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
              <div className="space-y-1">
                {results.exceedsAllowed && (
                  <p>قيمة الدفعة المطلوبة تتجاوز الحد الاقصى المسموح لطلب قيمة الدفعة تحت الحساب.</p>
                )}
                {results.allowedNegative && <p>الحد الاقصى المسموح بالسالب: اجمالي المنصرف أكبر من اقل حد مسموح به.</p>}
              </div>
            </div>
          )}
          {meta.isError && <p className="text-xs text-danger">تعذر تحميل نسب الحساب؛ بعض القيم لن تُحسب قبل الحفظ.</p>}
        </FormSection>

        <FormSection title="بيانات عامة">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DateField
              {...common}
              name="siteReceiptDate"
              label="تاريخ استلام الموقع"
              error={errors.siteReceiptDate?.message}
            />
            <SelectField
              {...common}
              name="prices"
              label="الاسعار"
              list={prices}
              emptyLabel="—"
              error={errors.prices?.message}
            />
            <Input
              label="مدة التنفيذ"
              autoComplete="off"
              readOnly={saving}
              error={errors.executionDuration?.message}
              {...form.register("executionDuration")}
            />
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
