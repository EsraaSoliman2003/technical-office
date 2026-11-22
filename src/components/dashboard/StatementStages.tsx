import { ClipboardList } from "lucide-react";
import { statementStages } from "./dashboard-data";

export default function StatementStages() {
  return (
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
  );
}
