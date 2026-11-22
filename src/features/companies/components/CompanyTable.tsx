"use client";

import {
  ArrowDown,
  Building2,
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
import type { Company } from "../types";

type CompanyTableProps = {
  companies: Company[];
  filteredCompanies: Company[];
  search: string;
  filters: DataTableFilters<Company>;
  formError: string;
  isFormOpen: boolean;
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: DataTableFilters<Company>) => void;
  onAdd: () => void;
  onView: (company: Company) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
};

const columns: DataTableColumn<Company>[] = [
  { key: "editTime", label: "توقيت التعديل", width: 140 },
  { key: "lastEdit", label: "آخر تعديل", width: 140 },
  { key: "addTime", label: "توقيت الإضافة", width: 190 },
  { key: "enteredBy", label: "مدخل البيانات", width: 145 },
  { key: "mobile", label: "الموبايل", width: 150 },
  { key: "commercialRegister", label: "السجل التجارى", width: 180 },
  { key: "name", label: "الشركة", width: 220 },
];

export default function CompanyTable({
  companies,
  filteredCompanies,
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
}: CompanyTableProps) {
  return (
    <section aria-label="جدول الشركات" className="data-page__card">
      <div className="data-page__toolbar">
        <label className="data-page__search">
          <input
            type="search"
            placeholder="بحث في الشركات..."
            aria-label="بحث في الشركات"
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

      {companies.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="data-page__empty-icon">
            <Building2 size={24} aria-hidden="true" />
          </span>
          <p className="data-page__empty-message mt-3">
            لا توجد شركات مضافة حتى الآن
          </p>
          <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
            أضف شركة لعرضها هنا. البيانات المحفوظة مؤقتة لهذه الجلسة.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#103462] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17477f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462] focus-visible:ring-offset-2"
          >
            <Plus size={15} aria-hidden="true" />
            إضافة شركة
          </button>
        </div>
      ) : (
        <DataTable<Company>
          columns={columns}
          rows={filteredCompanies}
          sourceRows={companies}
          filters={filters}
          onFiltersChange={onFiltersChange}
          actionsHeader="الإجراءات"
          actionsWidth={115}
          emptyIcon={<Search size={22} />}
          emptyText="لا توجد شركات مطابقة للبحث أو الفلاتر"
          renderActions={(company) => (
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                title="عرض التفاصيل"
                aria-label={`عرض تفاصيل الشركة ${company.name}`}
                onClick={() => onView(company)}
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#103462] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462]"
              >
                <Eye size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                title="تعديل"
                aria-label={`تعديل الشركة ${company.name}`}
                onClick={() => onEdit(company)}
                className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Pencil size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                title="حذف"
                aria-label={`حذف الشركة ${company.name}`}
                onClick={() => onDelete(company)}
                className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          )}
        />
      )}

      {companies.length > 0 && (
        <footer className="data-page__footer">
          <span>
            عدد الشركات: {filteredCompanies.length}
            {filteredCompanies.length !== companies.length &&
              ` من ${companies.length}`}
          </span>
          <span className="data-page__result-status">
            <ArrowDown size={13} aria-hidden="true" />
            {filteredCompanies.length > 0
              ? `عرض ${filteredCompanies.length} شركة`
              : "لا توجد نتائج"}
          </span>
        </footer>
      )}
    </section>
  );
}
