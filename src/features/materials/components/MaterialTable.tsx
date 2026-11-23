"use client";

import {
  ArrowDown,
  FileSpreadsheet,
  Package,
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
import type { Material } from "../types";

type MaterialTableProps = {
  materials: Material[];
  filteredMaterials: Material[];
  search: string;
  filters: DataTableFilters<Material>;
  formError: string;
  isFormOpen: boolean;
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: DataTableFilters<Material>) => void;
  onAdd: () => void;
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
};

const columns: DataTableColumn<Material>[] = [
  { key: "editTime", label: "توقيت التعديل", width: 140 },
  { key: "lastEdit", label: "آخر تعديل", width: 140 },
  { key: "addTime", label: "توقيت الإضافة", width: 190 },
  { key: "enteredBy", label: "مدخل البيانات", width: 145 },
  { key: "name", label: "الخامة", width: "calc(100% - 730px)" },
];

export default function MaterialTable({
  materials,
  filteredMaterials,
  search,
  filters,
  formError,
  isFormOpen,
  onSearchChange,
  onFiltersChange,
  onAdd,
  onEdit,
  onDelete,
}: MaterialTableProps) {
  return (
    <section aria-label="جدول الخامات" className="data-page__card">
      <div className="data-page__toolbar">
        <label className="data-page__search">
          <input
            type="search"
            placeholder="بحث في الخامات..."
            aria-label="بحث في الخامات"
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

      {materials.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="data-page__empty-icon">
            <Package size={24} aria-hidden="true" />
          </span>
          <p className="data-page__empty-message mt-3">
            لا توجد خامات مضافة حتى الآن
          </p>
          <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
            أضف خامة لعرضها هنا. البيانات المحفوظة مؤقتة لهذه الجلسة.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#103462] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17477f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462] focus-visible:ring-offset-2"
          >
            <Plus size={15} aria-hidden="true" />
            إضافة خامة
          </button>
        </div>
      ) : (
        <DataTable<Material>
          columns={columns}
          rows={filteredMaterials}
          sourceRows={materials}
          filters={filters}
          onFiltersChange={onFiltersChange}
          actionsHeader="الإجراءات"
          actionsWidth={115}
          emptyIcon={<Search size={22} />}
          emptyText="لا توجد خامات مطابقة للبحث أو الفلاتر"
          renderActions={(material) => (
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                title="تعديل"
                aria-label={`تعديل الخامة ${material.name}`}
                onClick={() => onEdit(material)}
                className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Pencil size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                title="حذف"
                aria-label={`حذف الخامة ${material.name}`}
                onClick={() => onDelete(material)}
                className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          )}
        />
      )}

      {materials.length > 0 && (
        <footer className="data-page__footer">
          <span>
            عدد الخامات: {filteredMaterials.length}
            {filteredMaterials.length !== materials.length &&
              ` من ${materials.length}`}
          </span>
          <span className="data-page__result-status">
            <ArrowDown size={13} aria-hidden="true" />
            {filteredMaterials.length > 0
              ? `عرض ${filteredMaterials.length} خامة`
              : "لا توجد نتائج"}
          </span>
        </footer>
      )}
    </section>
  );
}
