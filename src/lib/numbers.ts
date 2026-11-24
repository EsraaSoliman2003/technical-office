/** Arabic-Indic (٠-٩) and Persian (۰-۹) digits → Latin digits. */
export function toLatinDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

/**
 * Typed decimal → plain "1234.5" text: Latin digits, Arabic decimal separator (٫) → ".",
 * thousands separators ("," / ٬) and spaces removed. Not validated.
 */
export function cleanDecimal(text: string): string {
  return toLatinDigits(text)
    .replace(/٫/g, ".")
    .replace(/[,٬\s]/g, "");
}

export type DecimalCheck = "empty" | "negative" | "invalid" | "decimals" | "ok";

/** Checks a typed non-negative decimal with at most `maxDecimals` decimal places. */
export function checkDecimal(text: string, maxDecimals = 2): DecimalCheck {
  const clean = cleanDecimal(text);
  if (clean === "") return "empty";
  if (clean.startsWith("-")) return /^-\d*\.?\d+$/.test(clean) ? "negative" : "invalid";
  const match = /^(\d+)(?:\.(\d+))?$/.exec(clean);
  if (!match) return "invalid";
  if ((match[2]?.length ?? 0) > maxDecimals) return "decimals";
  return "ok";
}

/** Parsed value of a typed decimal, or null when it is not a number. */
export function parseDecimal(text: string): number | null {
  const clean = cleanDecimal(text);
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) return null;
  return Number(clean);
}

const amountFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 220000000 → "220,000,000.00" (Latin digits, show with dir="ltr"). */
export function formatAmount(value: number): string {
  return amountFormat.format(value);
}

/** "2025-03-09" → "2025/03/09" — date-only text, no Date/timezone conversion. Empty → "—". */
export function formatDateOnly(value: string | null | undefined): string {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
  return match ? `${match[1]}/${match[2]}/${match[3]}` : "—";
}
