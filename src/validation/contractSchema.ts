import { z } from "zod";
import { CONTRACT_DATE_FIELDS, CONTRACT_VALUE_FIELDS } from "@/types/contract";
import { codeText, dateText, notesText, optionalText } from "./codeText";
import { optionalDecimalText } from "./decimalText";

export const MAX_CONTRACT_NAME_LENGTH = 500;
export const MAX_RETURN_REASON_LENGTH = 1000;

const dates = Object.fromEntries(CONTRACT_DATE_FIELDS.map((field) => [field, dateText])) as Record<
  (typeof CONTRACT_DATE_FIELDS)[number],
  typeof dateText
>;
const values = Object.fromEntries(CONTRACT_VALUE_FIELDS.map((field) => [field, optionalDecimalText(2)])) as Record<
  (typeof CONTRACT_VALUE_FIELDS)[number],
  ReturnType<typeof optionalDecimalText>
>;

export const getContractSchema = () => {
  return z.object({
    /** Required; Arabic-Indic digits are converted to Latin. */
    contractNumber: codeText(50, "رقم العقد").pipe(z.string().min(1, { message: "رقم العقد مطلوب" })),
    name: z
      .string()
      .trim()
      .min(1, { message: "اسم العقد مطلوب" })
      .max(MAX_CONTRACT_NAME_LENGTH, { message: `اسم العقد يجب ألا يزيد عن ${MAX_CONTRACT_NAME_LENGTH} حرف` }),
    projectTypeId: z.string(),
    projectId: z.string().min(1, { message: "اختر المشروع" }),
    companyId: z.string().min(1, { message: "اختر الشركة المنفذة" }),
    /** "" = no stage. */
    stage: z.string(),
    notes: notesText(),
    returnReason: optionalText(MAX_RETURN_REASON_LENGTH, `سبب الرجوع يجب ألا يزيد عن ${MAX_RETURN_REASON_LENGTH} حرف`),
    ...dates,
    ...values,
  });
};

/** Form values (what the fields hold). */
export type ContractFormValues = z.input<ReturnType<typeof getContractSchema>>;
/** Validated values (trimmed, Latin digits). */
export type ContractSchemaType = z.output<ReturnType<typeof getContractSchema>>;
