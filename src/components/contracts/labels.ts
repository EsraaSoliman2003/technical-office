import type { ContractAttachmentCategory, ContractDateField, ContractItem, ContractValueField } from "@/types/contract";

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
  boqSubmissionDate: "تاريخ تقديم المقايسة",
  supplySubmissionDate: "تاريخ تقديم التوريد",
  authoritySubmissionDate: "تاريخ التقديم للهيئة",
  authorityReturnDate: "تاريخ الرجوع من الهيئة",
  authorityReturnForCompletionDate: "تاريخ الرجوع للاستيفاء",
  cardPrintDate: "تاريخ طباعة الكارت",
  bookletsDeliveryDate: "تاريخ تسليم الكراسات",
  fundingDate: "تاريخ التمويل",
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
