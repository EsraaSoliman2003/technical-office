"use client";

import {
  ArrowDown,
  Eye,
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
import type { ProjectMaterial } from "../types";

type ProjectMaterialTableProps = {
  projectMaterials: ProjectMaterial[];
  filteredProjectMaterials: ProjectMaterial[];
  search: string;
  filters: DataTableFilters<ProjectMaterial>;
  formError: string;
  isFormOpen: boolean;
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: DataTableFilters<ProjectMaterial>) => void;
  onAdd: () => void;
  onView: (projectMaterial: ProjectMaterial) => void;
  onEdit: (projectMaterial: ProjectMaterial) => void;
  onDelete: (projectMaterial: ProjectMaterial) => void;
};

const columns: DataTableColumn<ProjectMaterial>[] = [
  { key: "editTime", label: "توقيت التعديل", width: 140 },
  { key: "lastEdit", label: "آخر تعديل", width: 140 },
  { key: "addTime", label: "توقيت الإضافة", width: 180 },
  {
    key: "notes",
    label: "ملاحظات",
    width: 180,
    filterable: false,
    render: (row) => row.notes || "—",
  },
  {
    key: "quantity",
    label: "الكمية",
    width: 100,
    filterable: false,
    render: (row) =>
      row.quantity ? Number(row.quantity).toLocaleString("en-US") : "—",
  },
  { key: "material", label: "الخامة", width: 130 },
  { key: "projectName", label: "اسم المشروع", width: 180 },
  { key: "billOfLadingNumber", label: "رقم البوليصة", width: 150 },
  { key: "authorizationNumber", label: "رقم التفويض", width: 140 },
];

export default function ProjectMaterialTable({
  projectMaterials,
  filteredProjectMaterials,
  search,
  filters,
  formError,
  isFormOpen,
  onSearchChange,
  onFiltersChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: ProjectMaterialTableProps) {
  return (
    <section aria-label="جدول خامات المشاريع" className="data-page__card">
      <div className="data-page__toolbar">
        <label className="data-page__search">
          <input
            type="search"
            placeholder="بحث في خامات المشاريع..."
            aria-label="بحث في خامات المشاريع"
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

      {projectMaterials.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="data-page__empty-icon">
            <Package size={24} aria-hidden="true" />
          </span>
          <p className="data-page__empty-message mt-3">
            لا توجد خامات مشاريع مضافة حتى الآن
          </p>
          <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
            أضف خامة مشروع لعرضها هنا. البيانات محفوظة مؤقتًا لهذه الجلسة.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#103462] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17477f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462] focus-visible:ring-offset-2"
          >
            <Plus size={15} aria-hidden="true" />
            إضافة خامة مشروع
          </button>
        </div>
      ) : (
        <DataTable<ProjectMaterial>
          columns={columns}
          rows={filteredProjectMaterials}
          sourceRows={projectMaterials}
          filters={filters}
          onFiltersChange={onFiltersChange}
          actionsHeader="الإجراءات"
          actionsWidth={135}
          emptyIcon={<Search size={22} />}
          emptyText="لا توجد خامات مشاريع مطابقة للبحث أو الفلاتر"
          renderActions={(projectMaterial) => (
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                title="عرض التفاصيل"
                aria-label={`عرض تفاصيل خامة المشروع ${projectMaterial.material}`}
                onClick={() => onView(projectMaterial)}
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#103462] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462]"
              >
                <Eye size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                title="تعديل"
                aria-label={`تعديل خامة المشروع ${projectMaterial.material}`}
                onClick={() => onEdit(projectMaterial)}
                className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Pencil size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                title="حذف"
                aria-label={`حذف خامة المشروع ${projectMaterial.material}`}
                onClick={() => onDelete(projectMaterial)}
                className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          )}
        />
      )}

      {projectMaterials.length > 0 && (
        <footer className="data-page__footer">
          <span>
            عدد خامات المشاريع: {filteredProjectMaterials.length}
            {filteredProjectMaterials.length !== projectMaterials.length &&
              ` من ${projectMaterials.length}`}
          </span>
          <span className="data-page__result-status">
            <ArrowDown size={13} aria-hidden="true" />
            {filteredProjectMaterials.length > 0
              ? `عرض ${filteredProjectMaterials.length} خامة مشروع`
              : "لا توجد نتائج"}
          </span>
        </footer>
      )}
    </section>
  );
}
