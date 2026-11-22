import Link from "next/link";
import {
  ArrowUpLeft,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  Landmark,
  PackageCheck,
  ReceiptText,
  Ruler,
} from "lucide-react";

const summaryStats = [
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

const financialStats = [
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

const recentStatements = [
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

const statementStages = [
  { name: "الكتيبة", count: 48 },
  { name: "اللواء", count: 36 },
  { name: "الإدارة", count: 27 },
  { name: "الهيئة", count: 19 },
  { name: "الفرع المالي", count: 12 },
  { name: "الصرف", count: 8 },
] as const;

const statToneClasses = {
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

const statusToneClasses = {
  amber: "bg-amber-50 text-amber-700 ring-amber-600/15",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/15",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
} as const;

export default function Page() {
  return (
    <main
      dir="rtl"
      className="min-h-0 flex-1 overflow-y-auto bg-[#f5f7fb] px-4 py-6 md:px-7 md:py-8"
    >
      <div className="mx-auto max-w-[1440px] space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <nav
              aria-label="مسار التنقل"
              className="mb-3 flex items-center gap-1.5 text-xs text-slate-400"
            >
              <Link href="/" className="transition hover:text-[#103462]">
                الرئيسية
              </Link>
              <ChevronLeft size={14} aria-hidden="true" />
              <span className="font-semibold text-slate-600">لوحة التحكم</span>
            </nav>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              لوحة التحكم
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 md:text-[15px]">
              متابعة المقايسات والعقود والمستخلصات والخامات في مكان واحد.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            بيانات تجريبية
          </span>
        </header>

        <section aria-label="الإحصائيات الرئيسية">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-[#103462]" />
            <h2 className="text-base font-bold text-slate-800">
              نظرة عامة على المنظومة
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryStats.map(({ title, value, note, icon: Icon, tone }) => (
              <article
                key={title}
                className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p
                      className={`mt-3 text-3xl font-bold tabular-nums ${statToneClasses[tone].value}`}
                    >
                      {value}
                    </p>
                  </div>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${statToneClasses[tone].icon}`}
                  >
                    <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-400">{note}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="financial-summary-title">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-[#103462]" />
              <h2
                id="financial-summary-title"
                className="text-base font-bold text-slate-800"
              >
                ملخص الموقف المالي
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              قيم مرجعية تجريبية
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {financialStats.map(
              ({ title, value, unit, icon: Icon, color, background }) => (
                <article
                  key={title}
                  className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
                >
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${background} ${color}`}
                  >
                    <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-slate-500">
                      {title}
                    </h3>
                    <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                      {value}
                      <span className="ms-1.5 text-xs font-medium text-slate-500">
                        {unit}
                      </span>
                    </p>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <section
            aria-labelledby="recent-statements-title"
            className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#103462]">
                  <FileText size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="recent-statements-title"
                    className="text-sm font-bold text-slate-800"
                  >
                    آخر المستخلصات
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    أحدث حركات المتابعة
                  </p>
                </div>
              </div>
              <Link
                href="/statements"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#103462] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462]"
              >
                عرض جميع المستخلصات
                <ArrowUpLeft size={15} aria-hidden="true" />
              </Link>
            </div>

            {recentStatements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[790px] text-right text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">رقم المستخلص</th>
                      <th scope="col" className="px-4 py-3">المشروع</th>
                      <th scope="col" className="px-4 py-3">الشركة</th>
                      <th scope="col" className="px-4 py-3">القيمة</th>
                      <th scope="col" className="px-4 py-3">المرحلة الحالية</th>
                      <th scope="col" className="px-4 py-3">الموقف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentStatements.map((statement) => (
                      <tr
                        key={statement.number}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#103462]">
                          {statement.number}
                        </td>
                        <td className="max-w-48 truncate px-4 py-3.5 font-medium text-slate-700">
                          {statement.project}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                          {statement.company}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-semibold tabular-nums text-slate-700">
                          {statement.value} <span className="font-normal">ج.م</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                          {statement.stage}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${statusToneClasses[statement.statusTone]}`}
                          >
                            {statement.statusTone === "emerald" ? (
                              <CheckCircle2 size={12} aria-hidden="true" />
                            ) : (
                              <Clock3 size={12} aria-hidden="true" />
                            )}
                            {statement.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <ClipboardList size={22} aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-slate-600">
                  لا توجد مستخلصات لعرضها
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  ستظهر المستخلصات هنا عند توفر البيانات.
                </p>
              </div>
            )}
          </section>

          <section
            aria-labelledby="stage-followup-title"
            className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <ClipboardList size={18} aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="stage-followup-title"
                  className="text-sm font-bold text-slate-800"
                >
                  متابعة مراحل المستخلصات
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  توزيع المستخلصات على مراحل الاعتماد
                </p>
              </div>
            </div>
            {statementStages.length > 0 ? (
              <ol className="space-y-4">
                {statementStages.map(({ name, count }, index) => (
                  <li key={name}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">
                        <span className="me-2 text-[10px] text-slate-300">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {name}
                      </span>
                      <span className="font-bold tabular-nums text-slate-700">
                        {count}
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label={`عدد المستخلصات في مرحلة ${name}`}
                      aria-valuemin={0}
                      aria-valuemax={statementStages[0].count}
                      aria-valuenow={count}
                    >
                      <div
                        className="h-full rounded-full bg-[#103462] transition-[width]"
                        style={{
                          width: `${(count / statementStages[0].count) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-xs text-slate-400">
                لا توجد بيانات متاحة عن مراحل المستخلصات.
              </p>
            )}
            <p className="mt-5 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
              أعداد توضيحية تجريبية قابلة للاستبدال ببيانات النظام.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
