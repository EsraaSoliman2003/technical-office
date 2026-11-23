"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Filter, Search } from "lucide-react";

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
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterMenu) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !filterMenuRef.current?.contains(target) &&
        !filterMenu.anchor.contains(target)
      ) {
        setFilterMenu(null);
        setFilterSearch("");
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFilterMenu(null);
        setFilterSearch("");
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [filterMenu]);

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
                      <button
                        type="button"
                        aria-label={`فلترة ${column.label}`}
                        aria-pressed={Boolean(
                          filters[column.key]?.length
                        )}
                        className={`entity-filter-button${filters[column.key]?.length
                          ? " entity-filter-button--active"
                          : ""}`}
                        onClick={(event) => {
                          setFilterSearch("");
                          setFilterMenu({
                            anchor: event.currentTarget,
                            key: column.key,
                            label: column.label,
                          });
                        }}
                      >
                        <Filter size={12} />
                        {filters[column.key]?.length ? (
                          <span className="entity-filter-button__count">
                            {filters[column.key]?.length}
                          </span>
                        ) : null}
                      </button>
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
        <div
          ref={filterMenuRef}
          className="entity-filter-menu"
          style={{
            top: filterMenu.anchor.getBoundingClientRect().bottom + 8,
            left: Math.max(
              8,
              filterMenu.anchor.getBoundingClientRect().left - 110
            ),
          }}
          role="dialog"
          aria-label={`فلترة ${filterMenu.label}`}
        >
          <div className="entity-filter-menu__header">
            <strong>{filterMenu.label}</strong>
            <button
              type="button"
              className="entity-filter-menu__clear"
              onClick={() => clearFilter(filterMenu.key)}
            >
              مسح
            </button>
          </div>

          <label className="entity-filter-menu__search">
            <Search size={14} />
            <input
              autoFocus
              type="search"
              value={filterSearch}
              placeholder="البحث في القيم..."
              aria-label={`البحث في قيم ${filterMenu.label}`}
              onChange={(event) => setFilterSearch(event.target.value)}
            />
          </label>

          <div className="entity-filter-menu__values">
            {filteredValues.map((value) => (
              <label
                key={value}
                className="entity-filter-menu__option"
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
              <p className="entity-filter-menu__empty">
                لا توجد قيم مطابقة للبحث
              </p>
            )}
          </div>

          <footer className="entity-filter-menu__footer">
            <button
              type="button"
              onClick={() => clearFilter(filterMenu.key)}
            >
              مسح الكل
            </button>
            <button
              type="button"
              className="entity-filter-menu__apply"
              onClick={() => {
                setFilterMenu(null);
                setFilterSearch("");
              }}
            >
              تم
            </button>
          </footer>
        </div>
      )}
    </>
  );
}
