import { formatAmount } from "@/lib/numbers";
import type {
  AdvanceSheetCalculatedField,
  AdvanceSheetItem,
  AdvanceSheetMoneyField,
  AdvanceSheetQuantityField,
} from "@/types/advanceSheet";

/** One row of حساب قيمة السلفة: an input (white) or a calculated value (read-only, grey). */
export type AdvanceCalcRow =
  | { kind: "money"; field: AdvanceSheetMoneyField; label: string }
  | { kind: "quantity"; field: AdvanceSheetQuantityField; label: string }
  | { kind: "percentInput"; field: "executionPercent"; label: string }
  | { kind: "calc"; field: AdvanceSheetCalculatedField; label: string; percent?: boolean };

/** حساب قيمة السلفة in the old form's order (two columns, row by row). */
export const ADVANCE_CALC_ROWS: readonly AdvanceCalcRow[] = [
  { kind: "calc", field: "maxByContract", label: "الحد الاقصى لصرف دفعات تحت الحساب من العقد" },
  { kind: "percentInput", field: "executionPercent", label: "نسبة التنفيذ %" },
  { kind: "calc", field: "maxByProgress", label: "الحد الاقصى للصرف طبقا لنسبة التنفيذ" },
  { kind: "calc", field: "maxOnSite", label: "الحد الاقصى لصرف المنفذ على الطبيعة" },
  { kind: "calc", field: "lowestMax", label: "اقل حد مسموح به من الحد الاقصى (العقد − الطبيعة)" },
  { kind: "money", field: "statementsSpent", label: "المنصرف على العقد (مستخلصات)" },
  { kind: "money", field: "advancesRemaining", label: "الباقي من السلف ولم يتم خصمه" },
  { kind: "money", field: "ironPrice", label: "سعر الحديد" },
  { kind: "money", field: "cementPrice", label: "سعر الاسمنت" },
  { kind: "quantity", field: "ironQuantity", label: "كمية الحديد" },
  { kind: "quantity", field: "cementQuantity", label: "كمية الاسمنت" },
  { kind: "money", field: "miscMaterialsValue", label: "قيمة الخامات المتنوعة" },
  { kind: "calc", field: "materialsRemaining", label: "الباقي من الخامات ولم يتم خصمه" },
  { kind: "calc", field: "totalSpent", label: "اجمالي المنصرف" },
  { kind: "calc", field: "totalSpentPercent", label: "نسبة اجمالي المنصرف", percent: true },
  { kind: "calc", field: "maxAllowedRequest", label: "الحد الاقصى المسموح لطلب قيمة الدفعة تحت الحساب" },
  { kind: "money", field: "requestedAmount", label: "قيمة الدفعة المطلوب صرفها تحت الحساب" },
  { kind: "calc", field: "requestedPercent", label: "نسبتها", percent: true },
  { kind: "calc", field: "remainingInContract", label: "اجمالي القيمة المتبقية في التعاقد" },
  { kind: "calc", field: "remainingPercent", label: "نسبتها", percent: true },
];

export const EXCEEDS_ALLOWED_LABEL = "تتجاوز الحد المسموح";

/** Name of a sheet in aria-labels and confirmations: "سلفة العقد 123 (1,000.00)". */
export function advanceSheetLabel(item: Pick<AdvanceSheetItem, "contractNumber" | "requestedAmount">) {
  const amount = item.requestedAmount === null ? "" : ` (${formatAmount(item.requestedAmount)})`;
  return `سلفة العقد ${item.contractNumber}${amount}`;
}
