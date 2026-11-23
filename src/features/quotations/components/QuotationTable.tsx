"use client";

import {
  ArrowDown,
  Eye,
  FileSpreadsheet,
  Pencil,
  Plus,
  Printer,
  Ruler,
  Search,
  Trash2,
} from "lucide-react";
import DataTable, {
  type DataTableColumn,
  type DataTableFilters,
} from "@/components/DataTable";
import type { Quotation } from "../types";

type QuotationTableProps = {
  quotations: Quotation[];
  filteredQuotations: Quotation[];
  search: string;
  filters: DataTableFilters<Quotation>;
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: DataTableFilters<Quotation>) => void;
  onAdd: () => void;
  onEdit: (quotation: Quotation) => void;
  onDelete: (quotation: Quotation) => void;
  onView: (quotation: Quotation) => void;
};

const columns: DataTableColumn<Quotation>[] = [
  { key: "number", label: "رقم المقايسة", width: 100, filterable: false },
  { key: "project", label: "اسم المشروع", width: 175 },
  { key: "company", label: "اسم الشركة", width: 160 },
  { key: "description", label: "وصف المقايسة", width: 190, filterable: false },
  {
    key: "administrationValue",
    label: "قيمة الإدارة",
    width: 140,
    filterable: false,
    render: (row) =>
      `${Number(row.administrationValue).toLocaleString("en-US")} ج.م`,
  },
  {
    key: "consultantValue",
    label: "قيمة الاستشاري",
    width: 145,
    filterable: false,
    render: (row) =>
      `${Number(row.consultantValue).toLocaleString("en-US")} ج.م`,
  },
  { key: "stage", label: "المرحلة الحالية", width: 125 },
  { key: "owner", label: "المسؤول الحالي", width: 140, filterable: false },
  {
    key: "status",
    label: "الحالة",
    width: 80,
    render: (row) => (
      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
        {row.status}
      </span>
    ),
  },
];

export default function QuotationTable({
  quotations,
  filteredQuotations,
  search,
  filters,
  onSearchChange,
  onFiltersChange,
  onAdd,
  onEdit,
  onDelete,
  onView,
}: QuotationTableProps) {
  return (
    <section aria-label="جدول المقايسات الجارية" className="data-page__card">
      <div className="data-page__toolbar">
        <label className="data-page__search">
          <input
            type="search"
            placeholder="بحث في المقايسات..."
            aria-label="بحث في المقايسات"
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

      {quotations.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="data-page__empty-icon">
            <Ruler size={24} aria-hidden="true" />
          </span>
          <p className="data-page__empty-message mt-3">
            لا توجد مقايسات مضافة حتى الآن
          </p>
          <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
            أضف مقايسة لعرضها هنا. لا توجد بيانات مقايسات مرتبطة بقاعدة بيانات
            أو API في المشروع حاليًا.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#103462] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17477f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462] focus-visible:ring-offset-2"
          >
            <Plus size={15} aria-hidden="true" />
            إضافة مقايسة
          </button>
        </div>
      ) : (
        <DataTable<Quotation>
          columns={columns}
          rows={filteredQuotations}
          sourceRows={quotations}
          filters={filters}
          onFiltersChange={onFiltersChange}
          actionsWidth={135}
          emptyIcon={<Search size={22} />}
          emptyText="لا توجد نتائج مطابقة للبحث أو الفلاتر"
          renderActions={(quotation) => (
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                title="عرض التفاصيل"
                aria-label={`عرض تفاصيل المقايسة ${quotation.number}`}
                onClick={() => onView(quotation)}
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#103462] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462]"
              >
                <Eye size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                title="تعديل"
                aria-label={`تعديل المقايسة ${quotation.number}`}
                onClick={() => onEdit(quotation)}
                className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Pencil size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                title="حذف"
                aria-label={`حذف المقايسة ${quotation.number}`}
                onClick={() => onDelete(quotation)}
                className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          )}
        />
      )}

      {quotations.length > 0 && (
        <footer className="data-page__footer">
          <span>
            عدد المقايسات: {filteredQuotations.length}
            {filteredQuotations.length !== quotations.length &&
              ` من ${quotations.length}`}
          </span>
          <span className="data-page__result-status">
            <ArrowDown size={13} aria-hidden="true" />
            {filteredQuotations.length > 0
              ? `عرض ${filteredQuotations.length} مقايسة`
              : "لا توجد نتائج"}
          </span>
        </footer>
      )}
    </section>
  );
}
