import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
      <div className="w-full max-w-md text-center">
        <div className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center rounded-full bg-primary-soft">
          <div className="absolute h-24 w-24 rounded-full bg-primary-soft" aria-hidden="true" />
          <FileQuestion size={62} strokeWidth={1.5} className="relative text-primary-text" aria-hidden="true" />
          <span
            dir="ltr"
            className="absolute -bottom-1 -left-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold text-primary-text shadow-sm"
          >
            404
          </span>
        </div>

        <h1 className="mb-3 text-3xl font-bold">الصفحة غير موجودة</h1>
        <p className="mb-8 text-sm leading-7 text-muted-foreground">
          يبدو أن الصفحة التي تبحث عنها غير متاحة
          <br />
          أو ربما تم نقلها إلى مكان آخر.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover"
        >
          <Home size={18} aria-hidden="true" />
          العودة للرئيسية
        </Link>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rotate-45 bg-accent" aria-hidden="true" />
          <span>منظومة المكتب الفني</span>
        </div>
      </div>
    </main>
  );
}
