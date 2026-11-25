import type {
  ContractAdvanceDateField,
  ContractAttachmentCategory,
  ContractDateField,
  ContractItem,
  ContractValueField,
} from "@/types/contract";

/** The attachment categories, in display order. */
export const CONTRACT_ATTACHMENT_CATEGORIES: readonly ContractAttachmentCategory[] = [
  "consultantReview",
  "approvedQuantities",
  "irSubmittal",
];

export const CONTRACT_ATTACHMENT_LABELS: Record<ContractAttachmentCategory, string> = {
  consultantReview: "مراجعة استشاري",
  approvedQuantities: "الحصر المعتمد",
  irSubmittal: "IR + Submittal",
};

/** The journey dates' labels (in `CONTRACT_DATE_FIELDS` order). */
export const CONTRACT_DATE_LABELS: Record<ContractDateField, string> = {
  // Same wording as the old form (the status each date gives depends on it: e.g. تموين ≠ تمويل).
  boqSubmissionDate: "تاريخ التسليم بالمقايسات",
  supplySubmissionDate: "تاريخ تسليم الامداد",
  authoritySubmissionDate: "تاريخ تسليم الهيئة",
  authorityReturnDate: "تاريخ الرجوع من الهيئة",
  authorityReturnForCompletionDate: "تاريخ الرجوع من الهيئة (استيفاء)",
  cardPrintDate: "تاريخ طباعة الكارت",
  bookletsDeliveryDate: "تاريخ تسليم الكراسات",
  fundingDate: "تاريخ نزول التموين",
  contractDate: "تاريخ التعاقد",
};

export const CONTRACT_VALUE_LABELS: Record<ContractValueField, string> = {
  battalionValue: "قيمة الكتيبة",
  managementValue: "قيمة الادارة",
  authorityValue: "قيمة الهيئة",
  discountValue: "قيمة التخفيض",
  overrunValue: "قيمة التجاوز",
  overrunPercent: "نسبة التجاوز %",
  ironRate: "فئة الحديد",
  cementRate: "فئة الاسمنت",
};

/** Name of a contract in aria-labels and confirmations: "العقد 123 (اسم العقد)". */
export function contractLabel(item: Pick<ContractItem, "contractNumber" | "name">) {
  return `العقد ${item.contractNumber} (${item.name})`;
}

/** قيمة العقد: الهيئة ?? الادارة ?? الكتيبة (like the server). */
export function contractValueOf(values: Partial<Record<ContractValueField, number | null>>): number | null {
  return values.authorityValue ?? values.managementValue ?? values.battalionValue ?? null;
}

/** السلفة's dates' labels (in `CONTRACT_ADVANCE_DATE_FIELDS` order, like the old form). */
export const CONTRACT_ADVANCE_DATE_LABELS: Record<ContractAdvanceDateField, string> = {
  advanceBrigadeDate: "تسليم اللواء",
  advanceManagementDate: "تسليم الادارة",
  advanceAuthorityDate: "تسليم الهيئة",
  advanceCentralDate: "الادارة المركزية",
  advancePaymentDate: "تاريخ الصرف",
};

/** The advance statuses shown as السلفة counters (like the old screen); labels come from `/meta`. */
export const ADVANCE_COUNTER_STATUSES: readonly string[] = ["Brigade", "Management", "Authority", "Central"];
