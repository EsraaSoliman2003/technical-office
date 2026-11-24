import { z } from "zod";
import { toLatinDigits } from "@/lib/numbers";

/**
 * An optional number/code typed by the user (رقم …, اذن التحميل): Arabic-Indic digits become Latin,
 * trimmed, at most `max` characters. "" = empty.
 */
export function codeText(max: number, label: string) {
  return z
    .string()
    .transform((value) => toLatinDigits(value).trim())
    .pipe(z.string().max(max, { message: `${label} يجب ألا يزيد عن ${max} حرفًا` }));
}

/** "" or a date input's "yyyy-MM-dd". */
export const dateText = z.string().refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
  message: "تاريخ غير صحيح",
});

/** Optional free text, trimmed, at most `max` characters. */
export const optionalText = (max: number, message: string) => z.string().trim().max(max, { message });

export const MAX_NOTES_LENGTH = 2000;

/** ملاحظات: optional, at most 2000 characters. */
export const notesText = () => optionalText(MAX_NOTES_LENGTH, `الملاحظات يجب ألا تزيد عن ${MAX_NOTES_LENGTH} حرف`);
