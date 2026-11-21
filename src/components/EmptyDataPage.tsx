"use client";

import { Search } from "lucide-react";

export default function EmptyDataPage({
  title,
  breadcrumb,
}: {
  title: string;
  breadcrumb: string;
}) {
  return (
    <main dir="rtl" className="min-h-screen overflow-y-auto bg-[#f5f8fc] p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        <p className="mt-1 text-xs text-slate-400">{breadcrumb}</p>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <button
            type="button"
            className="rounded-lg bg-[#103462] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#17477f]"
          >
            إضافة جديد
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-64 items-center rounded-lg border border-slate-200 px-3">
              <input
                type="text"
                placeholder={`بحث في ${title}...`}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <Search size={16} className="text-slate-400" />
            </div>
            <button
              type="button"
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              بحث
            </button>
          </div>
        </div>

        <div className="flex min-h-72 items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-slate-100" />
            <p className="text-sm font-medium text-slate-500">لا توجد بيانات</p>
          </div>
        </div>

        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
          العدد: 0
        </div>
      </section>
    </main>
  );
}
