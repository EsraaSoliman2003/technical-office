import { z } from "zod";
import { checkDecimal, parseDecimal, toLatinDigits } from "@/lib/numbers";
import { decimalText } from "./decimalText";

export const MAX_NOTES_LENGTH = 2000;

const optionalText = (max: number, message: string) => z.string().trim().max(max, { message });

export const getCompanyMaterialSchema = () => {
  return z.object({
    /** Optional; Arabic-Indic digits are converted to Latin. */
    loadingPermitNumber: z
      .string()
      .transform((value) => toLatinDigits(value).trim())
      .pipe(z.string().max(50, { message: "رقم اذن التحميل يجب ألا يزيد عن 50 حرفًا" })),
    projectId: z.string().min(1, { message: "اختر المشروع" }),
    materialId: z.string().min(1, { message: "اختر الخامة" }),
    companyId: z.string().min(1, { message: "اختر الشركة المنفذة" }),
    /** > 0, up to 3 decimals (kept as text, parse with `parseDecimal`). */
    quantity: decimalText("الكمية مطلوبة", 3).refine(
      (value) => checkDecimal(value, 3) !== "ok" || (parseDecimal(value) ?? 0) > 0,
      { message: "الكمية يجب أن تكون أكبر من صفر" }
    ),
    receivingEngineer: optionalText(200, "اسم المهندس المستلم يجب ألا يزيد عن 200 حرف"),
    notes: optionalText(MAX_NOTES_LENGTH, `الملاحظات يجب ألا تزيد عن ${MAX_NOTES_LENGTH} حرف`),
  });
};

/** Form values (what the fields hold). */
export type CompanyMaterialFormValues = z.input<ReturnType<typeof getCompanyMaterialSchema>>;
/** Validated values (trimmed, Latin digits). */
export type CompanyMaterialSchemaType = z.output<ReturnType<typeof getCompanyMaterialSchema>>;
