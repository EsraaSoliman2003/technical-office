"use client";

import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import ColumnFilterButton from "@/components/list/ColumnFilterButton";
import FilterPopover from "@/components/list/FilterPopover";

export type DataTableColumn<T extends object> = {
  key: keyof T & string;
  label: string;
  width: string | number;
  align?: "start" | "center" | "end";
  filterable?: boolean;
  render?: (row: T) => ReactNode;
};

export type DataTableFilters<T extends object> =
  Partial<Record<keyof T & string, string[]>>;

type DataTableProps<T extends object & { id: string | number }> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  sourceRows?: T[];
  filters: DataTableFilters<T>;
  onFiltersChange: (filters: DataTableFilters<T>) => void;
  renderActions?: (row: T) => ReactNode;
  actionsHeader?: string;
  actionsWidth?: string | number;
  emptyIcon?: ReactNode;
  emptyText: string;
  rowKey?: (row: T) => string | number;
  className?: string;
};

type FilterMenuState = {
  anchor: HTMLButtonElement;
  key: string;
  label: string;
};

export default function DataTable<T extends object & { id: string | number }>({
  columns,
  rows,
  sourceRows = rows,
  filters,
  onFiltersChange,
  renderActions,
  actionsHeader = "إجراءات",
  actionsWidth = 220,
  emptyIcon,
  emptyText,
  rowKey = (row) => row.id,
  className = "",
}: DataTableProps<T>) {
  const [filterMenu, setFilterMenu] = useState<FilterMenuState | null>(null);
  const [filterSearch, setFilterSearch] = useState("");

  const getUniqueValues = (key: string) => {
    return Array.from(
      new Set(
        sourceRows.map((row) =>
          String(row[key as keyof T] ?? "")
        )
      )
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "ar"));
  };

  const toggleFilterValue = (key: string, value: string) => {
    const selected = filters[key as keyof T & string] ?? [];
    onFiltersChange({
      ...filters,
      [key]: selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    });
  };

  const clearFilter = (key: string) => {
    onFiltersChange({ ...filters, [key]: [] });
  };

  const filteredValues = filterMenu
    ? getUniqueValues(filterMenu.key).filter((value) =>
        value
          .toLocaleLowerCase("ar")
          .includes(filterSearch.trim().toLocaleLowerCase("ar"))
      )
    : [];

  const actionsWidthStyle =
    typeof actionsWidth === "number" ? `${actionsWidth}px` : actionsWidth;

  return (
    <>
      <div className={`data-page__table-scroll ${className}`.trim()}>
        <table className="data-page__table">
          <colgroup>
            {columns.map((column) => (
              <col
                key={column.key}
                style={{
                  width:
                    typeof column.width === "number"
                      ? `${column.width}px`
                      : column.width,
                }}
              />
            ))}
            {renderActions && <col style={{ width: actionsWidthStyle }} />}
          </colgroup>

          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    textAlign: column.align ?? "center",
                    width:
                      typeof column.width === "number"
                        ? `${column.width}px`
                        : column.width,
                  }}
                >
                  <span className="data-page__column-label">
                    <span>{column.label}</span>
                    {column.filterable !== false && (
                      <ColumnFilterButton
                        label={column.label}
                        active={Boolean(filters[column.key]?.length)}
                        expanded={filterMenu?.key === column.key}
                        count={filters[column.key]?.length}
                        onClick={(button) => {
                          setFilterSearch("");
                          setFilterMenu((current) =>
                            current?.key === column.key
                              ? null
                              : {
                                  anchor: button,
                                  key: column.key,
                                  label: column.label,
                                }
                          );
                        }}
                      />
                    )}
                  </span>
                </th>
              ))}
              {renderActions && (
                <th style={{ width: actionsWidthStyle, textAlign: "center" }}>
                  {actionsHeader}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={{
                        textAlign: column.align ?? "center",
                        width:
                          typeof column.width === "number"
                            ? `${column.width}px`
                            : column.width,
                      }}
                    >
                      {column.render
                        ? column.render(row)
                        : String(row[column.key] ?? "")}
                    </td>
                  ))}
                  {renderActions && (
                    <td style={{ width: actionsWidthStyle }}>
                      {renderActions(row)}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (renderActions ? 1 : 0)}
                  className="data-page__empty-cell"
                >
                  <div className="data-page__empty">
                    {emptyIcon && (
                      <span className="data-page__empty-icon">
                        {emptyIcon}
                      </span>
                    )}
                    <p className="data-page__empty-message">{emptyText}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filterMenu && (
        <FilterPopover
          anchor={filterMenu.anchor}
          ariaLabel={`فلترة ${filterMenu.label}`}
          className="w-64 rounded-xl border border-border bg-surface p-3 text-foreground shadow-lg"
          onClose={() => {
            setFilterMenu(null);
            setFilterSearch("");
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <strong className="text-xs font-semibold">{filterMenu.label}</strong>
            <button
              type="button"
              className="text-xs font-medium text-primary-text hover:underline"
              onClick={() => clearFilter(filterMenu.key)}
            >
              مسح
            </button>
          </div>

          <label className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-surface px-2">
            <Search size={14} aria-hidden="true" className="shrink-0 text-muted-foreground" />
            <input
              autoFocus
              type="search"
              value={filterSearch}
              placeholder="البحث في القيم..."
              aria-label={`البحث في قيم ${filterMenu.label}`}
              className="filter-search-input h-9 min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-0"
              onChange={(event) => setFilterSearch(event.target.value)}
            />
          </label>

          <div className="max-h-56 overflow-y-auto">
            {filteredValues.map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-xs hover:bg-surface-muted"
              >
                <input
                  type="checkbox"
                  checked={
                    filters[
                      filterMenu.key as keyof T & string
                    ]?.includes(value) ?? false
                  }
                  onChange={() =>
                    toggleFilterValue(filterMenu.key, value)
                  }
                />
                <span>{value}</span>
              </label>
            ))}

            {filteredValues.length === 0 && (
              <p className="py-2 text-xs text-muted-foreground">
                لا توجد قيم مطابقة للبحث
              </p>
            )}
          </div>

          <footer className="mt-2 flex justify-end border-t border-border pt-2">
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-muted"
              onClick={() => clearFilter(filterMenu.key)}
            >
              مسح الكل
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
              onClick={() => {
                setFilterMenu(null);
                setFilterSearch("");
              }}
            >
              تم
            </button>
          </footer>
        </FilterPopover>
      )}
    </>
  );
}
