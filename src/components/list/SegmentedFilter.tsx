"use client";

import { cn } from "@/lib/cn";

export type SegmentedFilterItem = {
  /** null = "الكل" (no filter). */
  value: string | null;
  label: string;
  /** Shown as "(n)" when given (e.g. counts per status). */
  count?: number;
};

type SegmentedFilterProps = {
  /** Accessible name of the group, e.g. "تصفية حسب موقف المشروع". */
  label: string;
  items: SegmentedFilterItem[];
  /** The active value; null/undefined = the "الكل" item. */
  value: string | null | undefined;
  onChange: (value: string | null) => void;
};

/** A row of toggle buttons for one filter (e.g. الكل · دراسة · …), the active one highlighted. */
export function SegmentedFilter({ label, items, value, onChange }: SegmentedFilterProps) {
  const current = value ?? null;
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex flex-wrap rounded-lg border border-border bg-surface-muted p-1"
    >
      {items.map((item) => {
        const active = item.value === current;
        return (
          <button
            key={item.value ?? "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-semibold whitespace-nowrap",
              active ? "bg-surface text-primary-text shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
            {item.count !== undefined && <span className="ms-1.5 tabular-nums opacity-80">({item.count})</span>}
          </button>
        );
      })}
    </div>
  );
}
