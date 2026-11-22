import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function DashboardHeader() {
  return (
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
  );
}
