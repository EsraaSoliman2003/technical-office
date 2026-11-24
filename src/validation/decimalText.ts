import { z } from "zod";
import { checkDecimal } from "@/lib/numbers";

const decimalsMessage = (maxDecimals: number) =>
  maxDecimals === 2 ? "يُسمح برقمين عشريين فقط" : `يُسمح بـ ${maxDecimals} أرقام عشرية فقط`;

/**
 * A typed non-negative decimal (≤ `maxDecimals` places), kept as text so the field can show
 * separators and accept Arabic-Indic digits. Parse it with `parseDecimal`.
 */
export function decimalText(requiredMessage: string, maxDecimals = 2) {
  return z.string().superRefine((value, ctx) => {
    const check = checkDecimal(value, maxDecimals);
    const message =
      check === "empty"
        ? requiredMessage
        : check === "negative"
          ? "القيمة يجب ألا تكون سالبة"
          : check === "invalid"
            ? "أدخل رقمًا صحيحًا"
            : check === "decimals"
              ? decimalsMessage(maxDecimals)
              : null;
    if (message) ctx.addIssue({ code: "custom", message });
  });
}
