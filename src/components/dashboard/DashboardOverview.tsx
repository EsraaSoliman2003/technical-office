import { financialStats, statToneClasses, summaryStats } from "./dashboard-data";

export function SummaryStats() {
  return (
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
  );
}

export function FinancialSummary() {
  return (
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
        <span className="text-[11px] text-slate-400">قيم مرجعية تجريبية</span>
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
                <h3 className="text-sm font-medium text-slate-500">{title}</h3>
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
  );
}
