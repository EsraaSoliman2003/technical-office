"use client";

import type { OptionList } from "@/components/options/useOptionList";
import { Combobox } from "@/components/ui";

type OptionFilterProps = {
  label: string;
  /** Placeholder when nothing is chosen, e.g. "كل المشاريع". */
  allLabel: string;
  list: OptionList;
  value: string | undefined;
  onChange: (value: string | null) => void;
};

/** A clearable dropdown filter for the `ListPage` toolbar (empty = all). */
export function OptionFilter({ label, allLabel, list, value, onChange }: OptionFilterProps) {
  return (
    <Combobox
      aria-label={label}
      placeholder={allLabel}
      clearable
      options={list.options}
      value={value ?? ""}
      onChange={(next) => onChange(next || null)}
      loading={list.loading}
      error={list.loadError ? `تعذر تحميل قائمة ${label}` : undefined}
      className="w-full sm:w-56"
    />
  );
}
