"use client";

import {
  ArrowDown,
  ClipboardList,
  Eye,
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
import type { Project } from "../types";

type ProjectTableProps = {
  projects: Project[];
  filteredProjects: Project[];
  search: string;
  filters: DataTableFilters<Project>;
  formError: string;
  isFormOpen: boolean;
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: DataTableFilters<Project>) => void;
  onAdd: () => void;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
};

const columns: DataTableColumn<Project>[] = [
  { key: "editTime", label: "توقيت التعديل", width: 130 },
  { key: "lastEdit", label: "آخر تعديل", width: 125 },
  { key: "addTime", label: "توقيت الإضافة", width: 175 },
  { key: "enteredBy", label: "مدخل البيانات", width: 135 },
  { key: "executionPercentage", label: "نسبة التنفيذ", width: 110 },
  { key: "completionDate", label: "تاريخ النهو", width: 130 },
  { key: "curbstones", label: "بلدورات", width: 100 },
  { key: "marble", label: "رخام", width: 90 },
  { key: "cement", label: "اسمنت", width: 90 },
  { key: "iron", label: "حديد", width: 90 },
  { key: "projectStatus", label: "موقف المشروع", width: 135 },
  { key: "allocation", label: "المخصص", width: 125 },
  { key: "name", label: "المشروع", width: 180 },
];

export default function ProjectTable({
  projects,
  filteredProjects,
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
}: ProjectTableProps) {
  return (
    <section aria-label="جدول المشاريع" className="data-page__card">
      <div className="data-page__toolbar">
        <label className="data-page__search">
          <input
            type="search"
            placeholder="بحث في المشاريع..."
            aria-label="بحث في المشاريع"
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

      {projects.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="data-page__empty-icon">
            <ClipboardList size={24} aria-hidden="true" />
          </span>
          <p className="data-page__empty-message mt-3">
            لا توجد مشاريع مضافة حتى الآن
          </p>
          <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
            أضف مشروعًا لعرضه هنا. البيانات المحفوظة مؤقتة لهذه الجلسة.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#103462] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17477f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462] focus-visible:ring-offset-2"
          >
            <Plus size={15} aria-hidden="true" />
            إضافة مشروع
          </button>
        </div>
      ) : (
        <DataTable<Project>
          columns={columns}
          rows={filteredProjects}
          sourceRows={projects}
          filters={filters}
          onFiltersChange={onFiltersChange}
          actionsHeader="الإجراءات"
          actionsWidth={115}
          emptyIcon={<Search size={22} />}
          emptyText="لا توجد مشاريع مطابقة للبحث أو الفلاتر"
          renderActions={(project) => (
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                title="عرض التفاصيل"
                aria-label={`عرض تفاصيل المشروع ${project.name}`}
                onClick={() => onView(project)}
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#103462] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462]"
              >
                <Eye size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                title="تعديل"
                aria-label={`تعديل المشروع ${project.name}`}
                onClick={() => onEdit(project)}
                className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Pencil size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                title="حذف"
                aria-label={`حذف المشروع ${project.name}`}
                onClick={() => onDelete(project)}
                className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          )}
        />
      )}

      {projects.length > 0 && (
        <footer className="data-page__footer">
          <span>
            عدد المشاريع: {filteredProjects.length}
            {filteredProjects.length !== projects.length &&
              ` من ${projects.length}`}
          </span>
          <span className="data-page__result-status">
            <ArrowDown size={13} aria-hidden="true" />
            {filteredProjects.length > 0
              ? `عرض ${filteredProjects.length} مشروع`
              : "لا توجد نتائج"}
          </span>
        </footer>
      )}
    </section>
  );
}
