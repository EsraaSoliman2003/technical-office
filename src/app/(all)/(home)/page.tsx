"use client";

import React from "react";
import {
  Building2,
  CalendarCheck,
  Mail,
  ClipboardList,
  FileSpreadsheet,
  FileSignature,
  ReceiptText,
  Boxes,
  Search,
  Download,
} from "lucide-react";

const services = [
  { title: "موقف المشاريع", icon: Building2 },
  { title: "التمام اليومي", icon: CalendarCheck },
  { title: "الجوابات", icon: Mail },
  { title: "المحاضر", icon: ClipboardList },
  { title: "البيانات", icon: FileSpreadsheet },
  { title: "العقود", icon: FileSignature },
  { title: "سلفة + مستخلص", icon: ReceiptText },
  { title: "الخامات", icon: Boxes },
];

const ServiceCard = ({
  title,
  icon: Icon,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) => (
  <button
    className="
      group relative flex flex-col items-center justify-between gap-4
      rounded-xl p-4 md:p-5
      bg-white border border-slate-200
      shadow-sm hover:shadow-md hover:border-blue-300
      transition-all duration-300 hover:-translate-y-1
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
    "
  >
    <div
      className="
        w-16 h-16 md:w-20 md:h-20
        rounded-full flex items-center justify-center
        bg-blue-50 text-[#103462]
        group-hover:bg-[#103462] group-hover:text-white
        transition-colors duration-300
      "
    >
      <Icon className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
    </div>

    <span
      className="
        w-full text-center text-sm md:text-base font-bold text-slate-700
        group-hover:text-[#103462] transition-colors
      "
    >
      {title}
    </span>
  </button>
);

export default function Page() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
            {/* Page Title */}
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#103462] rounded-full"></div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                لوحة التحكم
              </h2>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto my-6">
              <input
                type="text"
                placeholder="بحث في وحدتك التنظيمية (عقود، مقايسات، شركات، مشاريع...)"
                className="w-full bg-[#fffbea] border border-[#fde68a] text-slate-700 text-sm rounded-full py-3 px-5 pr-12 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition shadow-sm"
              />
              <Search
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-6">
              {[
                "الصفحة الرئيسية",
                "الأولويات",
                "بيان الصرف",
                "متابعة المهام والمواقف",
              ].map((tab, i) => (
                <button
                  key={i}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm border ${i === 3
                      ? "bg-[#103462] text-white border-[#103462]"
                      : "bg-white text-[#103462] border-slate-200 hover:border-[#103462]"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Main Card Container */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
              {/* Card Header */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-[#103462] rounded-full"></div>
                  <h3 className="text-lg font-bold text-slate-800">
                    متابعة المهام والمواقف
                  </h3>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <input
                      type="text"
                      placeholder="بحث..."
                      className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg py-2 px-4 pr-10 focus:outline-none focus:border-[#103462]"
                    />
                    <Search
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                  </div>
                  <button className="flex items-center gap-2 border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition whitespace-nowrap">
                    <Download size={16} />
                    تصدير إكسل
                  </button>
                </div>
              </div>

              {/* ===== 8 Cards Layout (4 Right + 4 Left) ===== */}
              <div className="flex flex-col md:flex-row md:justify-between gap-8">
                {/* Right Group */}
                <div className="grid grid-cols-2 gap-4 md:gap-6 md:w-[45%]">
                  {services.slice(0, 4).map((service, i) => (
                    <ServiceCard
                      key={i}
                      title={service.title}
                      icon={service.icon}
                    />
                  ))}
                </div>

                {/* Center Gap (فاضي على الشاشات الكبيرة) */}
                <div className="hidden md:block w-px bg-slate-100"></div>

                {/* Left Group */}
                <div className="grid grid-cols-2 gap-4 md:gap-6 md:w-[45%]">
                  {services.slice(4, 8).map((service, i) => (
                    <ServiceCard
                      key={i}
                      title={service.title}
                      icon={service.icon}
                    />
                  ))}
                </div>
              </div>
            </div>
      </div>
    </main>
  );
}