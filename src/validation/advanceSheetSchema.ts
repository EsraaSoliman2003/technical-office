import { z } from "zod";
import { checkDecimal, parseDecimal } from "@/lib/numbers";
import {
  ADVANCE_SHEET_MONEY_FIELDS,
  ADVANCE_SHEET_QUANTITY_FIELDS,
  type AdvanceSheetMoneyField,
  type AdvanceSheetQuantityField,
} from "@/types/advanceSheet";
import { dateText, optionalText } from "./codeText";
import { optionalDecimalText } from "./decimalText";

export const MAX_EXECUTION_DURATION_LENGTH = 50;

const money = Object.fromEntries(ADVANCE_SHEET_MONEY_FIELDS.map((field) => [field, optionalDecimalText(2)])) as Record<
  AdvanceSheetMoneyField,
  ReturnType<typeof optionalDecimalText>
>;
const quantities = Object.fromEntries(
  ADVANCE_SHEET_QUANTITY_FIELDS.map((field) => [field, optionalDecimalText(3)])
) as Record<AdvanceSheetQuantityField, ReturnType<typeof optionalDecimalText>>;

export const getAdvanceSheetSchema = () => {
  return z.object({
    contractId: z.string().min(1, { message: "اختر العقد" }),
    /** نسبة التنفيذ %: optional, 0–100. */
    executionPercent: optionalDecimalText(2).refine(
      (value) => checkDecimal(value, 2) !== "ok" || (parseDecimal(value) ?? 0) <= 100,
      { message: "النسبة يجب ألا تزيد عن 100" }
    ),
    siteReceiptDate: dateText,
    /** الاسعار: "" = none. */
    prices: z.string(),
    executionDuration: optionalText(
      MAX_EXECUTION_DURATION_LENGTH,
      `مدة التنفيذ يجب ألا تزيد عن ${MAX_EXECUTION_DURATION_LENGTH} حرف`
    ),
    ...money,
    ...quantities,
  });
};

/** Form values (what the fields hold). */
export type AdvanceSheetFormValues = z.input<ReturnType<typeof getAdvanceSheetSchema>>;
/** Validated values (trimmed). */
export type AdvanceSheetSchemaType = z.output<ReturnType<typeof getAdvanceSheetSchema>>;
