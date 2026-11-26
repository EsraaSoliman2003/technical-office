"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import ColumnFilterButton from "./ColumnFilterButton";
import FilterPopover from "./FilterPopover";

export type ColumnFilterOption = {
  value: string;
  label: string;
};

type ColumnValueFilterProps = {
  label: string;
  options: ColumnFilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  loading?: boolean;
  loadError?: boolean;
};

export default function ColumnValueFilter({
  label,
  options,
  selectedValues,
  onChange,
  loading = false,
  loadError = false,
}: ColumnValueFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const visibleOptions = options.filter((option) =>
    option.label.toLocaleLowerCase("ar").includes(search.trim().toLocaleLowerCase("ar"))
  );

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  const toggleOption = (value: string) => {
    onChange(
      selectedValues.includes(value)
        ? selectedValues.filter((selected) => selected !== value)
        : [...selectedValues, value]
    );
  };

  return (
    <>
      <ColumnFilterButton
        label={label}
        active={selectedValues.length > 0}
        expanded={open}
        count={selectedValues.length}
        onClick={(button) => {
          setAnchor(button);
          setSearch("");
          setOpen((current) => !current);
        }}
      />
      {open && (
        <FilterPopover
          anchor={anchor}
          ariaLabel={`فلترة ${label}`}
          className="w-64 rounded-xl border border-border bg-surface p-3 text-foreground shadow-lg"
          onClose={close}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <strong className="text-xs font-semibold">{label}</strong>
            {selectedValues.length > 0 && (
              <button
                type="button"
                className="text-xs font-medium text-primary-text hover:underline"
                onClick={() => onChange([])}
              >
                مسح
              </button>
            )}
          </div>
          <label className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-surface px-2">
            <Search size={14} aria-hidden="true" className="shrink-0 text-muted-foreground" />
            <input
              type="search"
              autoFocus
              value={search}
              placeholder="البحث في القيم..."
              aria-label={`البحث في قيم ${label}`}
              className="filter-search-input h-9 min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-0"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="max-h-56 overflow-y-auto">
            {loading ? (
              <p className="py-2 text-xs text-muted-foreground">جارٍ تحميل القيم...</p>
            ) : loadError ? (
              <p className="py-2 text-xs text-danger">تعذر تحميل القيم</p>
            ) : visibleOptions.length > 0 ? (
              visibleOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-xs hover:bg-surface-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => toggleOption(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))
            ) : (
              <p className="py-2 text-xs text-muted-foreground">لا توجد قيم مطابقة</p>
            )}
          </div>
        </FilterPopover>
      )}
    </>
  );
}
