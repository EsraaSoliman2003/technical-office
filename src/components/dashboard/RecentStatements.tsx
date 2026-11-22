import Link from "next/link";
import {
  ArrowUpLeft,
  CheckCircle2,
  Clock3,
  ClipboardList,
  FileText,
} from "lucide-react";
import { recentStatements, statusToneClasses } from "./dashboard-data";

export default function RecentStatements() {
  return (
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
  );
}
