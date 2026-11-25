import { z } from "zod";
import { checkDecimal, parseDecimal } from "@/lib/numbers";
import {
  STATEMENT_DATE_FIELDS,
  STATEMENT_OPTIONAL_AMOUNT_FIELDS,
  STATEMENT_TEXT_FIELDS,
  type StatementDateField,
  type StatementOptionalAmountField,
  type StatementTextField,
} from "@/types/statement";
import { dateText, notesText, optionalText } from "./codeText";
import { decimalText, optionalDecimalText } from "./decimalText";

/** Max length of الضابط, موقف التامينات, جواب مركزية and التكويد. */
export const MAX_STATEMENT_TEXT_LENGTH = 200;
/** الرتبة is shorter on the server (100). */
const MAX_LENGTH_OF: Partial<Record<StatementTextField, number>> = { officerRank: 100 };

const dates = Object.fromEntries(STATEMENT_DATE_FIELDS.map((field) => [field, dateText])) as Record<
  StatementDateField,
  typeof dateText
>;
const amounts = Object.fromEntries(
  STATEMENT_OPTIONAL_AMOUNT_FIELDS.map((field) => [field, optionalDecimalText(2)])
) as Record<StatementOptionalAmountField, ReturnType<typeof optionalDecimalText>>;
const texts = Object.fromEntries(
  STATEMENT_TEXT_FIELDS.map((field) => {
    const max = MAX_LENGTH_OF[field] ?? MAX_STATEMENT_TEXT_LENGTH;
    return [field, optionalText(max, `النص يجب ألا يزيد عن ${max} حرف`)];
  })
) as Record<StatementTextField, ReturnType<typeof optionalText>>;

/** A valid typed amount as a number (null when empty or invalid). */
const valueOf = (text: string) => (checkDecimal(text, 2) === "ok" ? parseDecimal(text) : null);

export const getStatementSchema = () => {
  return z.object({
    contractId: z.string().min(1, { message: "اختر العقد" }),
    /** قيمة المستخلص: required, > 0. */
    amount: decimalText("قيمة المستخلص مطلوبة", 2).refine((value) => (valueOf(value) ?? 1) > 0, {
      message: "قيمة المستخلص يجب أن تكون أكبر من صفر",
    }),
    /** نسبة التنفيذ %: optional, 0–100. */
    executionPercent: optionalDecimalText(2).refine((value) => (valueOf(value) ?? 0) <= 100, {
      message: "النسبة يجب ألا تزيد عن 100",
    }),
    /** دفعة: "" = none. */
    installment: z.string(),
    notes: notesText(),
    ...dates,
    ...amounts,
    ...texts,
  });
};

/** Form values (what the fields hold). */
export type StatementFormValues = z.input<ReturnType<typeof getStatementSchema>>;
/** Validated values (trimmed). */
export type StatementSchemaType = z.output<ReturnType<typeof getStatementSchema>>;
