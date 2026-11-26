import { checkDecimal, cleanDecimal } from "@/lib/numbers";
import type { AdvanceSheetCalculatedField } from "@/types/advanceSheet";

/**
 * Exact decimal arithmetic for حساب قيمة السلفة: a value is an integer `n` scaled by 10^`s`
 * (like the deliveries totals' integer thousandths, but in BigInt so money × quantity can't lose
 * digits). Money results are rounded to whole piastres (2 decimals, half away from zero) like the
 * server, so there are no float artifacts such as "-0.00" or 0.30000000000000004.
 */
type Dec = { n: bigint; s: number };

const TEN = BigInt(10);
const ZERO_BIG = BigInt(0);
const ZERO: Dec = { n: ZERO_BIG, s: 0 };

const pow10 = (exponent: number) => TEN ** BigInt(exponent);

/** "1234.50" (already validated, plain digits) → Dec. */
function parsePlain(text: string): Dec | null {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) return null;
  const fraction = match[3] ?? "";
  const n = BigInt(match[2] + fraction);
  return { n: match[1] ? -n : n, s: fraction.length };
}

/** A typed amount (Arabic-Indic digits, separators): its value, or null when empty / invalid. */
export function decOfText(text: string | undefined, maxDecimals: number): Dec | null {
  if (!text || checkDecimal(text, maxDecimals) !== "ok") return null;
  return parsePlain(cleanDecimal(text));
}

/** A number from the API (a contract value or a rate such as 0.75). */
export function decOfNumber(value: number | null | undefined): Dec | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  // Rates / money have few decimals; 12 places covers them without exponent notation.
  const text = Math.abs(value) < 1e21 ? value.toFixed(12).replace(/\.?0+$/, "") : null;
  return text ? parsePlain(text) : null;
}

function align(a: Dec, b: Dec): [bigint, bigint, number] {
  const s = Math.max(a.s, b.s);
  return [a.n * pow10(s - a.s), b.n * pow10(s - b.s), s];
}

const add = (a: Dec, b: Dec): Dec => {
  const [x, y, s] = align(a, b);
  return { n: x + y, s };
};
const sub = (a: Dec, b: Dec): Dec => add(a, { n: -b.n, s: b.s });
const mul = (a: Dec, b: Dec): Dec => ({ n: a.n * b.n, s: a.s + b.s });
const compare = (a: Dec, b: Dec) => {
  const [x, y] = align(a, b);
  return x === y ? 0 : x < y ? -1 : 1;
};
const min = (a: Dec, b: Dec) => (compare(a, b) <= 0 ? a : b);

/** `numerator / denominator` rounded half away from zero (both integers, denominator > 0). */
function divRound(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < ZERO_BIG;
  const abs = negative ? -numerator : numerator;
  let quotient = abs / denominator;
  if ((abs % denominator) * BigInt(2) >= denominator) quotient += BigInt(1);
  return negative ? -quotient : quotient;
}

/** Rounded to 2 decimals (whole piastres / hundredths of a percent). */
function round2(a: Dec): Dec {
  if (a.s <= 2) return { n: a.n * pow10(2 - a.s), s: 2 };
  return { n: divRound(a.n, pow10(a.s - 2)), s: 2 };
}

/** `part / whole × 100`, rounded to 2 decimals; null when `whole` is 0. */
function percentOf(part: Dec, whole: Dec): Dec | null {
  if (whole.n === ZERO_BIG) return null;
  // part.n/10^part.s ÷ whole.n/10^whole.s × 100, kept as an integer of hundredths.
  let numerator = part.n * pow10(whole.s) * BigInt(100) * BigInt(100);
  let denominator = whole.n * pow10(part.s);
  if (denominator < ZERO_BIG) {
    numerator = -numerator;
    denominator = -denominator;
  }
  return { n: divRound(numerator, denominator), s: 2 };
}

/** A 2-decimal Dec as a number for display (exact: hundredths ÷ 100; never -0). */
const toNumber = (a: Dec | null) => (a === null ? null : Number(round2(a).n) / 100);

export type AdvanceInputs = {
  /** قيمة المشروع (V); null / 0 → the V-based values are null ("—"). */
  contractValue: number | null | undefined;
  rates: { contractAdvanceCapRate: number; onSiteRate: number } | undefined;
  executionPercent: string;
  statementsSpent: string;
  advancesRemaining: string;
  ironPrice: string;
  cementPrice: string;
  ironQuantity: string;
  cementQuantity: string;
  miscMaterialsValue: string;
  requestedAmount: string;
};

export type AdvanceResults = Record<AdvanceSheetCalculatedField, number | null> & {
  /** السلفة above الحد الاقصى المسموح. */
  exceedsAllowed: boolean;
  /** الحد الاقصى المسموح is below zero. */
  allowedNegative: boolean;
};

/**
 * The sheet's formulas (live preview; the server's values replace them after save). Empty inputs
 * count as 0. V = contract value, rates from `/meta`:
 * maxByContract = V × cap · maxByProgress = V × التنفيذ/100 · maxOnSite = maxByProgress × onSite ·
 * lowestMax = min(maxByContract, maxOnSite) · materialsRemaining = حديد + اسمنت + متنوعة ·
 * totalSpent = مستخلصات + باقي السلف + materialsRemaining · maxAllowedRequest = lowestMax − totalSpent ·
 * remainingInContract = V − مستخلصات − السلفة; the percentages are of V.
 */
export function calculateAdvance(inputs: AdvanceInputs): AdvanceResults {
  const money = (text: string) => decOfText(text, 2) ?? ZERO;
  const quantity = (text: string) => decOfText(text, 3) ?? ZERO;
  const contractValue = decOfNumber(inputs.contractValue);
  const v = contractValue && contractValue.n !== ZERO_BIG ? contractValue : null;
  const cap = decOfNumber(inputs.rates?.contractAdvanceCapRate);
  const onSite = decOfNumber(inputs.rates?.onSiteRate);

  const statementsSpent = money(inputs.statementsSpent);
  const requested = money(inputs.requestedAmount);

  const maxByContract = v && cap ? round2(mul(v, cap)) : null;
  // ÷ 100 = 2 more decimal places.
  const progress = decOfText(inputs.executionPercent, 2) ?? ZERO;
  const maxByProgress = v ? round2(mul(v, { n: progress.n, s: progress.s + 2 })) : null;
  const maxOnSite = maxByProgress && onSite ? round2(mul(maxByProgress, onSite)) : null;
  const lowestMax = maxByContract && maxOnSite ? min(maxByContract, maxOnSite) : null;

  const materialsRemaining = round2(
    add(
      add(
        mul(quantity(inputs.ironQuantity), money(inputs.ironPrice)),
        mul(quantity(inputs.cementQuantity), money(inputs.cementPrice))
      ),
      money(inputs.miscMaterialsValue)
    )
  );
  const totalSpent = round2(add(add(statementsSpent, money(inputs.advancesRemaining)), materialsRemaining));
  const maxAllowedRequest = lowestMax ? round2(sub(lowestMax, totalSpent)) : null;
  const remainingInContract = v ? round2(sub(sub(v, statementsSpent), requested)) : null;

  return {
    maxByContract: toNumber(maxByContract),
    maxByProgress: toNumber(maxByProgress),
    maxOnSite: toNumber(maxOnSite),
    lowestMax: toNumber(lowestMax),
    materialsRemaining: toNumber(materialsRemaining),
    totalSpent: toNumber(totalSpent),
    totalSpentPercent: v ? toNumber(percentOf(totalSpent, v)) : null,
    maxAllowedRequest: toNumber(maxAllowedRequest),
    requestedPercent: v ? toNumber(percentOf(requested, v)) : null,
    remainingInContract: toNumber(remainingInContract),
    remainingPercent: v && remainingInContract ? toNumber(percentOf(remainingInContract, v)) : null,
    exceedsAllowed: maxAllowedRequest !== null && compare(round2(requested), maxAllowedRequest) > 0,
    allowedNegative: maxAllowedRequest !== null && maxAllowedRequest.n < ZERO_BIG,
  };
}
