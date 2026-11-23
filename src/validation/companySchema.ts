import { z } from "zod";

/** Arabic-Indic (٠-٩) and Persian (۰-۹) digits → Latin digits. */
export function toLatinDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

/** Latin digits without spaces or dashes, e.g. "٠١٠ ١٢٣٤-٥٦٧٨" → "01012345678". */
export function normalizeMobile(value: string): string {
  return toLatinDigits(value).replace(/[\s\-‐-―]/g, "");
}

/** Egyptian mobile: 010 / 011 / 012 / 015 + 8 digits. */
const EGYPT_MOBILE = /^01[0125]\d{8}$/;

export const getCompanySchema = () => {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: "الاسم مطلوب" })
      .max(200, { message: "الاسم يجب ألا يزيد عن 200 حرف" }),
    commercialRegister: z.string().trim().max(50, { message: "السجل التجاري يجب ألا يزيد عن 50 حرف" }),
    mobile: z
      .string()
      .trim()
      .refine((value) => value === "" || EGYPT_MOBILE.test(normalizeMobile(value)), {
        message: "رقم الموبايل غير صحيح (يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقمًا)",
      }),
  });
};

export type CompanySchemaType = z.infer<ReturnType<typeof getCompanySchema>>;
