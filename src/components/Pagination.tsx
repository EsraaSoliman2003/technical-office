"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

type PageItem = number | "gap-start" | "gap-end";

/** 1 … p-1 p p+1 … last */
function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) items.push("gap-start");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push("gap-end");
  items.push(totalPages);
  return items;
}

const buttonBase =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold tabular-nums disabled:opacity-50";

export default function Pagination({ page, totalPages, onPageChange, disabled = false }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="ترقيم الصفحات">
      <ul className="flex flex-wrap items-center gap-1.5">
        <li>
          <button
            type="button"
            aria-label="الصفحة السابقة"
            title="الصفحة السابقة"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
            className={cn(buttonBase, "border-border bg-surface text-foreground hover:bg-surface-muted")}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </li>

        {getPageItems(page, totalPages).map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <button
                type="button"
                aria-label={`الصفحة ${item}`}
                aria-current={item === page ? "page" : undefined}
                disabled={disabled}
                onClick={() => item !== page && onPageChange(item)}
                className={cn(
                  buttonBase,
                  item === page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground hover:bg-surface-muted"
                )}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="px-1 text-muted-foreground">
              …
            </li>
          )
        )}

        <li>
          <button
            type="button"
            aria-label="الصفحة التالية"
            title="الصفحة التالية"
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className={cn(buttonBase, "border-border bg-surface text-foreground hover:bg-surface-muted")}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
