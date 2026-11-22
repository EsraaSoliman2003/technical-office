import type { QuotationForm } from "./types";

export const quotationStages = [
  "الكتيبة",
  "اللواء",
  "الإدارة",
  "الهيئة",
  "الفرع المالي",
  "الصرف",
];

export const quotationStatuses = ["جارية", "قيد المراجعة", "معتمدة", "مرفوضة"];

export const emptyQuotationForm: QuotationForm = {
  number: "",
  project: "",
  company: "",
  description: "",
  administrationValue: "",
  consultantValue: "",
  stage: "",
  owner: "",
  status: "",
};

export const quotationStatusClassName: Record<string, string> = {
  جارية: "bg-blue-50 text-blue-700",
  "قيد المراجعة": "bg-amber-50 text-amber-700",
  معتمدة: "bg-emerald-50 text-emerald-700",
  مرفوضة: "bg-red-50 text-red-700",
};
