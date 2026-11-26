"use client";

import { Filter } from "lucide-react";

type ColumnFilterButtonProps = {
  label: string;
  active: boolean;
  expanded: boolean;
  count?: number;
  onClick: (button: HTMLButtonElement) => void;
};

export default function ColumnFilterButton({
  label,
  active,
  expanded,
  count = 1,
  onClick,
}: ColumnFilterButtonProps) {
  return (
    <button
      type="button"
      aria-label={`فلترة ${label}`}
      aria-pressed={active}
      aria-expanded={expanded}
      title={active ? `يوجد فلتر على ${label}` : `فلترة ${label}`}
      className={`relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
        active
          ? "border-primary/30 bg-primary-soft text-primary-text shadow-sm"
          : "border-border/70 bg-surface text-muted-foreground hover:border-primary/30 hover:bg-surface-muted hover:text-primary-text"
      } ${expanded ? "ring-2 ring-primary/15" : ""}`}
      onClick={(event) => onClick(event.currentTarget)}
    >
      <Filter size={12} aria-hidden="true" />
      {active && (
        <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border-2 border-surface bg-primary px-0.5 text-[8px] font-bold leading-none text-primary-foreground">
          {count}
        </span>
      )}
    </button>
  );
}
