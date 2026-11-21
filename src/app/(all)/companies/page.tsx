
"use client";

import React from "react";
import {
    ArrowDown,
    ArrowUpDown,
    ChevronDown,
    FileSpreadsheet,
    Filter,
    Printer,
    Search,
    SlidersHorizontal,
} from "lucide-react";

const columns = [
    "المشروع",
    "الكود",
    "الجهة",
    "المقاول",
    "الاستشاري",
    "إجمالي التعاقد",
    "قيمة التعاقد",
    "مدة التعاقد",
    "قيمة الأعمال",
    "المستخلص الفعلي",
    "التنفيذ الفعلي",
    "التنفيذ المالي",
];

export default function Page() {
    return (
        <div dir="rtl" className="min-h-screen bg-[#f5f8fc] p-4">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h1 className="text-base font-bold text-slate-800">
                        مشروعات الشركة
                    </h1>
                    <p className="mt-1 text-[11px] text-slate-400">
                        Dashboard / مشروعات الشركة
                    </p>
                </div>

            </div>

            {/* Actions */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <button className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-600 transition hover:bg-slate-50">
                    <Printer size={13} />
                    طباعة الجدول
                </button>

                <button className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-600 transition hover:bg-slate-50">
                    <FileSpreadsheet size={13} />
                    تصدير إكسيل
                </button>
            </div>

            {/* Table Card */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                {/* Search */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-3">
                    <div />

                    <div className="flex flex-1 items-center gap-2 sm:max-w-md">
                        <div className="flex h-8 flex-1 items-center rounded-md border border-slate-200 bg-white px-3">
                            <input
                                type="text"
                                placeholder="بحث في مشروعات الشركة..."
                                className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
                            />
                            <Search size={14} className="text-slate-400" />
                        </div>

                        <button className="rounded-md bg-[#103462] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#17477f]">
                            بحث
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[1100px] border-collapse text-center">
                        <thead>
                            <tr className="bg-[#103462] text-white">
                                <th className="w-8 border border-white/10 px-2 py-2">
                                    <Filter size={12} />
                                </th>

                                {columns.map((column) => (
                                    <th
                                        key={column}
                                        className="border border-white/10 px-2 py-2 text-[10px] font-semibold whitespace-nowrap"
                                    >
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span>{column}</span>
                                            <ArrowUpDown
                                                size={10}
                                                className="shrink-0 text-blue-200"
                                            />
                                            <Filter
                                                size={10}
                                                className="shrink-0 text-blue-200"
                                            />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td
                                    colSpan={columns.length + 1}
                                    className="h-20 border-b border-slate-100 text-xs text-slate-500"
                                >
                                    لا توجد بيانات
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[10px] text-slate-400">
                    <span>عدد المشروعات: 0</span>
                    <span className="flex items-center gap-1">
                        <ArrowDown size={12} />
                        لا توجد نتائج
                    </span>
                </div>
            </div>
        </div>
    );
}
