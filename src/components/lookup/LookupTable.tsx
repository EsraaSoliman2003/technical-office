"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/formatDate";
import type { LookupDto, LookupSortBy, SortDir } from "@/types/lookup";

type LookupTableProps = {
  items: LookupDto[];
  fieldLabel: string;
  sortBy: LookupSortBy;
  sortDir: SortDir;
  onSort: (column: LookupSortBy) => void;
  canWrite: boolean;
  onEdit: (item: LookupDto) => void;
  onDelete: (item: LookupDto) => void;
  /** Show skeleton rows instead of items. */
  loading?: boolean;
  /** Dim the rows while a refetch is running. */
  refreshing?: boolean;
};

const SKELETON_ROWS = 6;

function SortHeader({
  label,
  column,
  sortBy,
  sortDir,
  onSort,
}: {
  label: string;
  column: LookupSortBy;
  sortBy: LookupSortBy;
  sortDir: SortDir;
  onSort: (column: LookupSortBy) => void;
}) {
  const active = sortBy === column;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="p-0">
      <button
        type="button"
        onClick={() => onSort(column)}
        title={`ترتيب حسب ${label}`}
        className="flex w-full items-center gap-1.5 px-4 py-3 text-start font-semibold whitespace-nowrap hover:text-primary-text"
      >
        {label}
        <Icon size={14} aria-hidden="true" className={cn("shrink-0", active ? "text-primary-text" : "opacity-40")} />
      </button>
    </th>
  );
}

function PlainHeader({ label, className }: { label: string; className?: string }) {
  return (
    <th scope="col" className={cn("px-4 py-3 text-start font-semibold whitespace-nowrap", className)}>
      {label}
    </th>
  );
}

function DateCell({ value }: { value: string | null }) {
  return (
    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
      <span dir="ltr" className="tabular-nums">
        {formatDateTime(value)}
      </span>
    </td>
  );
}

export default function LookupTable({
  items,
  fieldLabel,
  sortBy,
  sortDir,
  onSort,
  canWrite,
  onEdit,
  onDelete,
  loading = false,
  refreshing = false,
}: LookupTableProps) {
  const columnCount = canWrite ? 6 : 5;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead className="border-b border-border bg-surface-muted text-foreground">
          <tr>
            <SortHeader label={fieldLabel} column="name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <PlainHeader label="مدخل البيانات" />
            <SortHeader label="توقيت الإضافة" column="createdAt" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <PlainHeader label="آخر تعديل" />
            <SortHeader label="توقيت التعديل" column="updatedAt" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            {canWrite && <PlainHeader label="الإجراءات" className="w-28 text-center" />}
          </tr>
        </thead>

        <tbody className={cn("transition-opacity", refreshing && "opacity-60")} aria-busy={loading || refreshing}>
          {loading
            ? Array.from({ length: SKELETON_ROWS }, (_, row) => (
                <tr key={row} className="border-b border-border last:border-b-0">
                  {Array.from({ length: columnCount }, (_, col) => (
                    <td key={col} className="px-4 py-4">
                      <div
                        className={cn("h-4 animate-pulse rounded bg-surface-muted", col === 0 ? "w-40" : "w-24")}
                      />
                    </td>
                  ))}
                </tr>
              ))
            : items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-b-0 hover:bg-surface-muted/50"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{item.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{item.createdByName || "—"}</td>
                  <DateCell value={item.createdAt} />
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{item.updatedByName || "—"}</td>
                  <DateCell value={item.updatedAt} />
                  {canWrite && (
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          aria-label={`تعديل ${item.name}`}
                          title="تعديل"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-accent-soft hover:text-accent-text"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          aria-label={`حذف ${item.name}`}
                          title="حذف"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
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
