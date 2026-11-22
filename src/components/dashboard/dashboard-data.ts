import {
  Banknote,
  Building2,
  FileCheck2,
  Landmark,
  PackageCheck,
  ReceiptText,
  Ruler,
} from "lucide-react";

export const summaryStats = [
  {
    title: "إجمالي المشروعات",
    value: "128",
    note: "مشروع مسجل",
    icon: Building2,
    tone: "blue",
  },
  {
    title: "المقايسات الجارية",
    value: "24",
    note: "تحت الإعداد والمراجعة",
    icon: Ruler,
    tone: "violet",
  },
  {
    title: "إجمالي العقود",
    value: "86",
    note: "عقد معتمد",
    icon: FileCheck2,
    tone: "emerald",
  },
  {
    title: "مستخلصات قيد المتابعة",
    value: "18",
    note: "في مختلف مراحل الاعتماد",
    icon: ReceiptText,
    tone: "amber",
  },
] as const;

export const financialStats = [
  {
    title: "إجمالي الارتباط",
    value: "41.006",
    unit: "مليار جنيه",
    icon: Landmark,
    color: "text-blue-700",
    background: "bg-blue-50",
  },
  {
    title: "إجمالي الصرف",
    value: "20.856",
    unit: "مليار جنيه",
    icon: Banknote,
    color: "text-emerald-700",
    background: "bg-emerald-50",
  },
  {
    title: "الخامات المخصومة",
    value: "4.636",
    unit: "مليار جنيه",
    icon: PackageCheck,
    color: "text-amber-700",
    background: "bg-amber-50",
  },
] as const;

export const recentStatements = [
  {
    number: "مخلص-2025-0148",
    project: "تطوير شبكة الطرق الداخلية",
    company: "النصر للمقاولات",
    value: "1,250,000",
    stage: "الإدارة",
    status: "قيد المراجعة",
    statusTone: "amber",
  },
  {
    number: "مخلص-2025-0147",
    project: "إنشاء مبنى الخدمات",
    company: "المقاولون العرب",
    value: "845,500",
    stage: "الهيئة",
    status: "جارٍ الاعتماد",
    statusTone: "blue",
  },
  {
    number: "مخلص-2025-0146",
    project: "أعمال البنية التحتية",
    company: "شركة التعمير",
    value: "2,100,000",
    stage: "الصرف",
    status: "تم الصرف",
    statusTone: "emerald",
  },
] as const;

export const statementStages = [
  { name: "الكتيبة", count: 48 },
  { name: "اللواء", count: 36 },
  { name: "الإدارة", count: 27 },
  { name: "الهيئة", count: 19 },
  { name: "الفرع المالي", count: 12 },
  { name: "الصرف", count: 8 },
] as const;

export const statToneClasses = {
  blue: {
    icon: "bg-blue-50 text-blue-700",
    value: "text-blue-950",
  },
  violet: {
    icon: "bg-violet-50 text-violet-700",
    value: "text-violet-950",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700",
    value: "text-emerald-950",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700",
    value: "text-amber-950",
  },
} as const;

export const statusToneClasses = {
  amber: "bg-amber-50 text-amber-700 ring-amber-600/15",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/15",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
} as const;
