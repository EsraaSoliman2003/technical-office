import { z } from "zod";
import { codeText, notesText, optionalText } from "./codeText";
import { quantityText } from "./decimalText";

export { MAX_NOTES_LENGTH } from "./codeText";

export const getCompanyMaterialSchema = () => {
  return z.object({
    /** Optional; Arabic-Indic digits are converted to Latin. */
    loadingPermitNumber: codeText(50, "رقم اذن التحميل"),
    projectId: z.string().min(1, { message: "اختر المشروع" }),
    materialId: z.string().min(1, { message: "اختر الخامة" }),
    companyId: z.string().min(1, { message: "اختر الشركة المنفذة" }),
    /** > 0, up to 3 decimals (kept as text, parse with `parseDecimal`). */
    quantity: quantityText(),
    receivingEngineer: optionalText(200, "اسم المهندس المستلم يجب ألا يزيد عن 200 حرف"),
    notes: notesText(),
  });
};

/** Form values (what the fields hold). */
export type CompanyMaterialFormValues = z.input<ReturnType<typeof getCompanyMaterialSchema>>;
/** Validated values (trimmed, Latin digits). */
export type CompanyMaterialSchemaType = z.output<ReturnType<typeof getCompanyMaterialSchema>>;
