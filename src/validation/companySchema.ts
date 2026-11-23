import { z } from "zod";

/** Arabic-Indic (٠-٩) and Persian (۰-۹) digits → Latin digits. */
export function toLatinDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

/**
 * Characters the server strips from a mobile number before checking it:
 * - whitespace,
 * - invisible format characters (pasted from RTL text / phones): soft hyphen U+00AD, Arabic letter
 *   mark U+061C, Mongolian vowel separator U+180E, zero-width chars and LRM/RLM U+200B–U+200F,
 *   bidi embeddings U+202A–U+202E, word joiner/invisible operators U+2060–U+2064,
 *   bidi isolates and deprecated format chars U+2066–U+206F, BOM U+FEFF,
 * - dashes: "-", U+2010–U+2015, minus U+2212, small hyphen-minus U+FE63, fullwidth hyphen-minus U+FF0D.
 */
const MOBILE_STRIP =
  /[\s­؜᠎​-‏‪-‮⁠-⁤⁦-⁯﻿\-‐-―−﹣－]/g;

/** Latin digits without spaces, dashes or invisible marks, e.g. "٠١٠ ١٢٣٤-٥٦٧٨" → "01012345678". */
export function normalizeMobile(value: string): string {
  return toLatinDigits(value).replace(MOBILE_STRIP, "");
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
