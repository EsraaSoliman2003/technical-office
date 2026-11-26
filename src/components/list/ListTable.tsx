"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SortDir } from "@/types/paged";

export type ListColumn<T, TSortBy extends string = string> = {
  /** Unique column key (React key). */
  key: string;
  header: string;
  /** Optional control displayed beside the header (e.g. a column filter). */
  headerControl?: ReactNode;
  /** Makes the header a sort button for this API sort column. */
  sortKey?: TSortBy;
  cell: (item: T) => ReactNode;
  /** Extra `<td>` classes (the cell already has `px-4 py-1.5`). */
  className?: string;
  /** Extra `<th>` classes (plain headers only). */
  headerClassName?: string;
};

export type RowAction<T> = {
  key: string;
  /** Tooltip; the aria-label is "{label} {item label}". */
  label: string;
  icon: LucideIcon;
  tone?: "accent" | "danger";
  onClick: (item: T) => void;
  /** Temporarily unavailable (e.g. while the parent form saves). Default: enabled. */
  disabled?: boolean;
};

type ListTableProps<T extends { id: string }, TSortBy extends string> = {
  items: T[];
  columns: ListColumn<T, TSortBy>[];
  /** Icon buttons in a last "الإجراءات" column (omit or empty → no column). */
  actions?: RowAction<T>[];
  /** Name of a row for screen readers (e.g. in "تعديل {name}"). */
  itemLabel: (item: T) => string;
  /** Current sort; omit `onSort` for a table without sortable headers. */
  sortBy?: TSortBy;
  sortDir?: SortDir;
  onSort?: (column: TSortBy) => void;
  /** Minimum table width (Tailwind class); narrower screens scroll inside the card. */
  minWidthClassName?: string;
  /** Show skeleton rows instead of items. */
  loading?: boolean;
  /** Dim the rows while a refetch is running. */
  refreshing?: boolean;
};

const SKELETON_ROWS = 6;

const actionToneClasses = {
  accent: "hover:bg-accent-soft hover:text-accent-text",
  danger: "hover:bg-danger-soft hover:text-danger",
};

function SortHeader<TSortBy extends string>({
  label,
  control,
  column,
  sortBy,
  sortDir,
  onSort,
}: {
  label: string;
  control?: ReactNode;
  column: TSortBy;
  sortBy: TSortBy | undefined;
  sortDir: SortDir;
  onSort: (column: TSortBy) => void;
}) {
  const active = sortBy === column;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="p-0">
      <div className="flex items-center gap-2 px-4 py-1">
        <button
          type="button"
          onClick={() => onSort(column)}
          title={`ترتيب حسب ${label}`}
          className="flex min-w-0 items-center gap-1.5 text-start font-semibold whitespace-nowrap hover:text-primary-text"
        >
          {label}
          <Icon size={14} aria-hidden="true" className={cn("shrink-0", active ? "text-primary-text" : "opacity-40")} />
        </button>
        {control}
      </div>
    </th>
  );
}

function PlainHeader({
  label,
  className,
  control,
}: {
  label: string;
  className?: string;
  control?: ReactNode;
}) {
  return (
    <th scope="col" className={cn("px-4 py-1 text-start font-semibold whitespace-nowrap", className)}>
      <div className="flex items-center gap-2">
        {label}
        {control}
      </div>
    </th>
  );
}

/** Table for paged API lists: sortable headers, skeleton rows, row action buttons. RTL column order. */
export default function ListTable<T extends { id: string }, TSortBy extends string>({
  items,
  columns,
  actions = [],
  itemLabel,
  sortBy,
  sortDir,
  onSort,
  minWidthClassName = "min-w-[760px]",
  loading = false,
  refreshing = false,
}: ListTableProps<T, TSortBy>) {
  const hasActions = actions.length > 0;
  const columnCount = columns.length + (hasActions ? 1 : 0);

  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", minWidthClassName)}>
        <thead className="border-b border-border bg-surface-muted text-foreground">
          <tr>
            {columns.map((column) =>
              column.sortKey && onSort ? (
                <SortHeader
                  key={column.key}
                  label={column.header}
                  control={column.headerControl}
                  column={column.sortKey}
                  sortBy={sortBy}
                  sortDir={sortDir ?? "asc"}
                  onSort={onSort}
                />
              ) : (
                <PlainHeader
                  key={column.key}
                  label={column.header}
                  className={column.headerClassName}
                  control={column.headerControl}
                />
              )
            )}
            {hasActions && <PlainHeader label="الإجراءات" className="w-28 text-center" />}
          </tr>
        </thead>

        <tbody className={cn("transition-opacity", refreshing && "opacity-60")} aria-busy={loading || refreshing}>
          {loading
            ? Array.from({ length: SKELETON_ROWS }, (_, row) => (
                <tr key={row} className="border-b border-border last:border-b-0">
                  {Array.from({ length: columnCount }, (_, col) => (
                    <td key={col} className="px-4 py-1">
                      <div
                        className={cn("h-4 animate-pulse rounded bg-surface-muted", col === 0 ? "w-40" : "w-24")}
                      />
                    </td>
                  ))}
                </tr>
              ))
            : items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted/50">
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-1", column.className)}>
                      {column.cell(item)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-1">
                      <div className="flex items-center justify-center gap-1">
                        {actions.map(({ key, label, icon: Icon, tone = "accent", onClick, disabled = false }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => onClick(item)}
                            disabled={disabled}
                            aria-label={`${label} ${itemLabel(item)}`}
                            title={label}
                            className={cn(
                              "rounded-lg p-1 text-muted-foreground",
                              actionToneClasses[tone],
                              "disabled:pointer-events-none disabled:opacity-50"
                            )}
                          >
                            <Icon size={16} aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
