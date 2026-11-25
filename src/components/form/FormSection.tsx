"use client";

import { useId, type ReactNode } from "react";

/** A titled part of a long form (e.g. بيانات العقد / التواريخ / القيم / المرفقات). */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h3 id={id} className="flex items-center gap-2 border-b border-border pb-2 text-sm font-bold text-foreground">
        <span className="h-2 w-2 rotate-45 bg-accent" aria-hidden="true" />
        {title}
      </h3>
      {children}
    </section>
  );
}

/** A read-only value shown like a field (e.g. موقف العقد, قيمة العقد); long text wraps. */
export function ReadOnlyField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div className="flex min-h-11 items-center rounded-lg border border-dashed border-border bg-surface-muted/60 px-3 py-2 text-sm">
        {children}
      </div>
    </div>
  );
}
