
"use client";

import Link from "next/link";
import { ArrowRight, FileQuestion, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-50 px-5"
    >
      <div className="w-full max-w-md text-center">
        {/* Illustration */}
        <div className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center rounded-full bg-blue-50">
          <div className="absolute h-24 w-24 rounded-full bg-blue-100/70" />

          <FileQuestion
            size={62}
            strokeWidth={1.5}
            className="relative text-[#103462]"
          />

          <span className="absolute -bottom-1 -left-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#103462] shadow-sm">
            404
          </span>
        </div>

        {/* Text */}
        <h1 className="mb-3 text-3xl font-bold text-slate-800">
          الصفحة غير موجودة
        </h1>

        <p className="mb-8 text-sm leading-7 text-slate-500">
          يبدو أن الصفحة التي تبحث عنها غير متاحة
          <br />
          أو ربما تم نقلها إلى مكان آخر.
        </p>

        {/* Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#103462] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17477f]"
        >
          <Home size={18} />
          العودة للرئيسية
        </button>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ArrowRight size={14} />
          <span>منظومة المكتب الفني</span>
        </div>
      </div>
    </div>
  );
}
