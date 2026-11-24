"use client";

import type { OptionList } from "@/components/options/useOptionList";
import { cn } from "@/lib/cn";

type SelectFilterProps = {
  label: string;
  /** The empty choice, e.g. "كل المراحل". */
  allLabel: string;
  list: OptionList;
  value: string | undefined;
  onChange: (value: string | null) => void;
};

/** A short fixed list (e.g. مرحلة العقد) as a native select in the `ListPage` toolbar (empty = all). */
export function SelectFilter({ label, allLabel, list, value, onChange }: SelectFilterProps) {
  return (
    <select
      aria-label={label}
      title={list.loadError ? `تعذر تحميل قائمة ${label}` : label}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value || null)}
      disabled={list.loading}
      className={cn(
        "h-11 w-full rounded-lg border bg-surface px-3 text-sm text-foreground shadow-sm sm:w-48",
        "focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60",
        list.loadError ? "border-danger" : "border-border"
      )}
    >
      <option value="">{list.loading ? "جاري التحميل…" : allLabel}</option>
      {list.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
