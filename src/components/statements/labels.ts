import { formatAmount } from "@/lib/numbers";
import type { StatementDateField, StatementItem, StatementTextField } from "@/types/statement";

/** مسار المستخلص's dates' labels (in `STATEMENT_DATE_FIELDS` order). */
export const STATEMENT_DATE_LABELS: Record<StatementDateField, string> = {
  battalionDate: "تاريخ الكتيبة",
  brigadeDate: "تاريخ اللواء",
  managementDate: "تاريخ الادارة",
  authorityDate: "تاريخ الهيئة",
  centralDate: "ادارة مركزية",
  paymentDate: "تاريخ الصرف",
};

export const STATEMENT_TEXT_LABELS: Record<StatementTextField, string> = {
  officerRank: "الرتبة",
  officerName: "الضابط",
  insuranceStatus: "موقف التامينات",
  centralLetter: "جواب مركزية",
  coding: "التكويد",
};

/**
 * The statuses shown as the contracts list's موقف المستخلص counters: معلق · كتيبة · لواء · ادارة ·
 * هيئة · مركزية. Matched by value (assumed names) or by label, so the labels and order still come
 * from `/api/statements/meta`.
 */
export const STATEMENT_COUNTER_STATUSES = {
  values: ["Pending", "Battalion", "Brigade", "Management", "Authority", "Central"],
  labels: ["معلق", "كتيبة", "لواء", "ادارة", "هيئة", "مركزية"],
} as const;

export function isStatementCounterStatus(option: { value: string; label: string }) {
  return (
    (STATEMENT_COUNTER_STATUSES.values as readonly string[]).includes(option.value) ||
    (STATEMENT_COUNTER_STATUSES.labels as readonly string[]).includes(option.label.trim())
  );
}

/** Name of a statement in aria-labels and confirmations: "مستخلص العقد 123 بقيمة 1,000.00". */
export function statementLabel(item: Pick<StatementItem, "contractNumber" | "amount">) {
  return `مستخلص العقد ${item.contractNumber} بقيمة ${formatAmount(item.amount)}`;
}

/**
 * النسبة المؤوية للصرف preview: amount / contract value × 100 (null without both). Per statement for
 * now; the server's value (maybe cumulative, to confirm with the client) replaces it after save.
 */
export function paymentPercentOf(amount: number | null, contractValue: number | null | undefined) {
  if (amount === null || !contractValue) return null;
  return (amount / contractValue) * 100;
}

/** اجمالي الخامات = الحديد + الاسمنت (null when both are empty). */
export function materialsTotalOf(iron: number | null, cement: number | null) {
  if (iron === null && cement === null) return null;
  return (iron ?? 0) + (cement ?? 0);
}
