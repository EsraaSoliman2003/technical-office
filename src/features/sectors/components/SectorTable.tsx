"use client";

import {
  ArrowDown,
  Briefcase,
  FileSpreadsheet,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import DataTable, {
  type DataTableColumn,
  type DataTableFilters,
} from "@/components/DataTable";
import type { Sector } from "../types";

type SectorTableProps = {
  sectors: Sector[];
  filteredSectors: Sector[];
  search: string;
  filters: DataTableFilters<Sector>;
  formError: string;
  isFormOpen: boolean;
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: DataTableFilters<Sector>) => void;
  onAdd: () => void;
  onEdit: (sector: Sector) => void;
  onDelete: (sector: Sector) => void;
};

const columns: DataTableColumn<Sector>[] = [
  { key: "editTime", label: "توقيت التعديل", width: "14%" },
  { key: "lastEdit", label: "آخر تعديل", width: "14%" },
  { key: "addTime", label: "توقيت الإضافة", width: "20%" },
  { key: "enteredBy", label: "مدخل البيانات", width: "14%" },
  { key: "name", label: "القطاع", width: "calc(38% - 220px)" },
];

export default function SectorTable({
  sectors,
  filteredSectors,
  search,
  filters,
  formError,
  isFormOpen,
  onSearchChange,
  onFiltersChange,
  onAdd,
  onEdit,
  onDelete,
}: SectorTableProps) {
  return (
    <section aria-label="جدول القطاعات" className="data-page__card">
      <div className="data-page__toolbar">
        <label className="data-page__search">
          <input
            type="search"
            placeholder="بحث في القطاعات..."
            aria-label="بحث في القطاعات"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <Search size={15} aria-hidden="true" />
        </label>

        <div className="data-page__actions">
          <button
            type="button"
            onClick={() => window.print()}
            className="data-page__action"
          >
            <Printer size={15} aria-hidden="true" />
            <span>طباعة الجدول</span>
          </button>
          <button
            type="button"
            disabled
            title="تصدير Excel غير متاح حاليًا"
            className="data-page__action"
          >
            <FileSpreadsheet size={15} aria-hidden="true" />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {formError && !isFormOpen && (
        <p
          role="alert"
          className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {formError}
        </p>
      )}

      {sectors.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="data-page__empty-icon">
            <Briefcase size={24} aria-hidden="true" />
          </span>
          <p className="data-page__empty-message mt-3">
            لا توجد قطاعات مضافة حتى الآن
          </p>
          <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
            أضف قطاعًا لعرضه هنا. لا توجد بيانات قطاعات محفوظة في مصدر بيانات
            حاليًا.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#103462] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17477f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462] focus-visible:ring-offset-2"
          >
            <Plus size={15} aria-hidden="true" />
            إضافة قطاع
          </button>
        </div>
      ) : (
        <DataTable<Sector>
          columns={columns}
          rows={filteredSectors}
          sourceRows={sectors}
          filters={filters}
          onFiltersChange={onFiltersChange}
          actionsHeader="الإجراءات"
          actionsWidth={135}
          emptyIcon={<Search size={22} />}
          emptyText="لا توجد قطاعات مطابقة للبحث أو الفلاتر"
          renderActions={(sector) => (
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                title="تعديل"
                aria-label={`تعديل القطاع ${sector.name}`}
                onClick={() => onEdit(sector)}
                className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Pencil size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                title={
                  sector.projectCount === null
                    ? "لا يمكن التحقق من ارتباط القطاع بالمشروعات"
                    : "حذف"
                }
                aria-label={`حذف القطاع ${sector.name}`}
                onClick={() => onDelete(sector)}
                disabled={
                  sector.projectCount === null || sector.projectCount > 0
                }
                className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          )}
        />
      )}

      {sectors.length > 0 && (
        <footer className="data-page__footer">
          <span>
            عدد القطاعات: {filteredSectors.length}
            {filteredSectors.length !== sectors.length &&
              ` من ${sectors.length}`}
          </span>
          <span className="data-page__result-status">
            <ArrowDown size={13} aria-hidden="true" />
            {filteredSectors.length > 0
              ? `عرض ${filteredSectors.length} قطاع`
              : "لا توجد نتائج"}
          </span>
        </footer>
      )}
    </section>
  );
}
