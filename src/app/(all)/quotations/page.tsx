"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDown,
  Eye,
  FileSpreadsheet,
  Plus,
  Printer,
  Ruler,
  Search,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import DataTable, {
  type DataTableColumn,
  type DataTableFilters,
} from "@/components/DataTable";
import { confirmDelete } from "@/utils/confirmDelete";

type QuotationRow = {
  id: number;
  number: string;
  project: string;
  company: string;
  description: string;
  administrationValue: string;
  consultantValue: string;
  stage: string;
  owner: string;
  status: string;
};

type QuotationForm = Omit<QuotationRow, "id">;

const stages = ["الكتيبة", "اللواء", "الإدارة", "الهيئة", "الفرع المالي", "الصرف"];
const statuses = ["جارية", "قيد المراجعة", "معتمدة", "مرفوضة"];

const emptyForm: QuotationForm = {
  number: "",
  project: "",
  company: "",
  description: "",
  administrationValue: "",
  consultantValue: "",
  stage: "",
  owner: "",
  status: "",
};

const columns: DataTableColumn<QuotationRow>[] = [
  { key: "number", label: "رقم المقايسة", width: 100, filterable: false },
  { key: "project", label: "اسم المشروع", width: 175 },
  { key: "company", label: "اسم الشركة", width: 160 },
  { key: "description", label: "وصف المقايسة", width: 190, filterable: false },
  {
    key: "administrationValue",
    label: "قيمة الإدارة",
    width: 140,
    filterable: false,
    render: (row) => `${Number(row.administrationValue).toLocaleString("en-US")} ج.م`,
  },
  {
    key: "consultantValue",
    label: "قيمة الاستشاري",
    width: 145,
    filterable: false,
    render: (row) => `${Number(row.consultantValue).toLocaleString("en-US")} ج.م`,
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

const statusClassName: Record<string, string> = {
  جارية: "bg-blue-50 text-blue-700",
  "قيد المراجعة": "bg-amber-50 text-amber-700",
  معتمدة: "bg-emerald-50 text-emerald-700",
  مرفوضة: "bg-red-50 text-red-700",
};

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationRow[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DataTableFilters<QuotationRow>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] =
    useState<QuotationRow | null>(null);
  const [detailsQuotation, setDetailsQuotation] =
    useState<QuotationRow | null>(null);
  const [form, setForm] = useState<QuotationForm>({ ...emptyForm });
  const [formError, setFormError] = useState("");

  const filteredQuotations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");

    return quotations.filter((quotation) => {
      const matchesSearch =
        !query ||
        Object.values(quotation).some((value) =>
          String(value).toLocaleLowerCase("ar").includes(query),
        );
      const matchesFilters = (
        ["project", "company", "stage", "status"] as const
      ).every((key) => {
        const selected = filters[key] ?? [];
        return selected.length === 0 || selected.includes(quotation[key]);
      });

      return matchesSearch && matchesFilters;
    });
  }, [filters, quotations, search]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingQuotation(null);
    setFormError("");
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingQuotation(null);
    setForm({ ...emptyForm });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (quotation: QuotationRow) => {
    setEditingQuotation(quotation);
    setForm({
      number: quotation.number,
      project: quotation.project,
      company: quotation.company,
      description: quotation.description,
      administrationValue: quotation.administrationValue,
      consultantValue: quotation.consultantValue,
      stage: quotation.stage,
      owner: quotation.owner,
      status: quotation.status,
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!event.currentTarget.reportValidity()) {
      setFormError("يرجى استكمال الحقول المطلوبة والتحقق من القيم المدخلة.");
      return;
    }

    const savedValues: QuotationForm = {
      number: form.number.trim(),
      project: form.project.trim(),
      company: form.company.trim(),
      description: form.description.trim(),
      administrationValue: form.administrationValue,
      consultantValue: form.consultantValue,
      stage: form.stage,
      owner: form.owner.trim(),
      status: form.status,
    };

    if (editingQuotation) {
      setQuotations((current) =>
        current.map((quotation) =>
          quotation.id === editingQuotation.id
            ? { ...savedValues, id: quotation.id }
            : quotation,
        ),
      );
    } else {
      setQuotations((current) => [
        { ...savedValues, id: Date.now() },
        ...current,
      ]);
    }

    resetForm();
  };

  const handleDelete = (quotation: QuotationRow) => {
    void confirmDelete(quotation.id, async (deleteId) => {
      setQuotations((current) =>
        current.filter((item) => item.id !== Number(deleteId)),
      );
    });
  };

  const updateFormField = (field: keyof QuotationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError("");
  };

  const formInputClass =
    "entity-edit__input min-h-10 text-sm focus:border-[#103462] focus:ring-2 focus:ring-[#103462]/10";

  return (
    <main
      dir="rtl"
      className={`data-page${filteredQuotations.length ? " data-page--has-rows" : ""}`}
    >
      <header className="data-page__heading">
        <div>
          <h1 className="data-page__title">المقايسات الجارية</h1>
          <p className="mt-1 text-xs text-slate-500">
            متابعة بيانات المقايسات وقيمها وموقفها الحالي داخل المشروعات.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="data-page__add inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          <span>إضافة مقايسة جديدة</span>
        </button>
      </header>

      <section
        aria-label="جدول المقايسات الجارية"
        className="data-page__card"
      >
        <div className="data-page__toolbar">
          <label className="data-page__search">
            <input
              type="search"
              placeholder="بحث في المقايسات..."
              aria-label="بحث في المقايسات"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
              onClick={openAddForm}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#103462] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17477f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462] focus-visible:ring-offset-2"
            >
              <Plus size={15} aria-hidden="true" />
              إضافة مقايسة
            </button>
          </div>
        ) : (
          <DataTable<QuotationRow>
            columns={columns}
            rows={filteredQuotations}
            sourceRows={quotations}
            filters={filters}
            onFiltersChange={setFilters}
            actionsWidth={135}
            emptyIcon={<Search size={22} />}
            emptyText="لا توجد نتائج مطابقة للبحث أو الفلاتر"
            renderActions={(quotation) => (
              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  title="عرض التفاصيل"
                  aria-label={`عرض تفاصيل المقايسة ${quotation.number}`}
                  onClick={() => setDetailsQuotation(quotation)}
                  className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#103462] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462]"
                >
                  <Eye size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="تعديل"
                  aria-label={`تعديل المقايسة ${quotation.number}`}
                  onClick={() => openEditForm(quotation)}
                  className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="حذف"
                  aria-label={`حذف المقايسة ${quotation.number}`}
                  onClick={() => handleDelete(quotation)}
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

      {isFormOpen && (
        <div
          className="entity-edit__overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) resetForm();
          }}
        >
          <form
            aria-labelledby="quotation-form-title"
            aria-modal="true"
            className="entity-edit__dialog max-h-[90vh] w-full max-w-3xl overflow-y-auto"
            onSubmit={handleSave}
            role="dialog"
          >
            <header className="entity-edit__header">
              <div>
                <h2 id="quotation-form-title" className="entity-edit__title">
                  {editingQuotation ? "تعديل المقايسة" : "إضافة مقايسة جديدة"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  الحقول المشار إليها مطلوبة. البيانات المحفوظة مؤقتة لهذه الجلسة.
                </p>
              </div>
              <button
                type="button"
                aria-label="إغلاق النافذة"
                className="entity-edit__close"
                onClick={resetForm}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            {formError && (
              <p
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                {formError}
              </p>
            )}

            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <label className="entity-edit__label">
                رقم المقايسة *
                <input
                  autoFocus
                  required
                  className={formInputClass}
                  value={form.number}
                  onChange={(event) => updateFormField("number", event.target.value)}
                  placeholder="أدخل رقم المقايسة"
                />
              </label>
              <label className="entity-edit__label">
                المشروع *
                <input
                  required
                  className={formInputClass}
                  value={form.project}
                  onChange={(event) => updateFormField("project", event.target.value)}
                  placeholder="أدخل اسم المشروع"
                />
              </label>
              <label className="entity-edit__label">
                الشركة *
                <input
                  required
                  className={formInputClass}
                  value={form.company}
                  onChange={(event) => updateFormField("company", event.target.value)}
                  placeholder="أدخل اسم الشركة"
                />
              </label>
              <label className="entity-edit__label">
                المسؤول الحالي *
                <input
                  required
                  className={formInputClass}
                  value={form.owner}
                  onChange={(event) => updateFormField("owner", event.target.value)}
                  placeholder="أدخل اسم المسؤول"
                />
              </label>
              <label className="entity-edit__label">
                قيمة المقايسة من الإدارة (جنيه) *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  className={formInputClass}
                  value={form.administrationValue}
                  onChange={(event) =>
                    updateFormField("administrationValue", event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>
              <label className="entity-edit__label">
                قيمة المقايسة من الاستشاري (جنيه) *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  className={formInputClass}
                  value={form.consultantValue}
                  onChange={(event) =>
                    updateFormField("consultantValue", event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>
              <label className="entity-edit__label">
                المرحلة الحالية *
                <select
                  required
                  className={formInputClass}
                  value={form.stage}
                  onChange={(event) => updateFormField("stage", event.target.value)}
                >
                  <option value="">اختر المرحلة</option>
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </label>
              <label className="entity-edit__label">
                الحالة *
                <select
                  required
                  className={formInputClass}
                  value={form.status}
                  onChange={(event) => updateFormField("status", event.target.value)}
                >
                  <option value="">اختر الحالة</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="entity-edit__label sm:col-span-2">
                وصف المقايسة *
                <textarea
                  required
                  rows={3}
                  className={`${formInputClass} resize-y`}
                  value={form.description}
                  onChange={(event) =>
                    updateFormField("description", event.target.value)
                  }
                  placeholder="اكتب وصفًا مختصرًا للمقايسة"
                />
              </label>
            </div>

            <footer className="entity-edit__actions">
              <button
                type="button"
                className="entity-edit__cancel"
                onClick={resetForm}
              >
                إلغاء
              </button>
              <button type="submit" className="entity-edit__save">
                {editingQuotation ? "حفظ التعديلات" : "إضافة المقايسة"}
              </button>
            </footer>
          </form>
        </div>
      )}

      {detailsQuotation && (
        <div
          className="entity-edit__overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailsQuotation(null);
          }}
        >
          <section
            aria-labelledby="quotation-details-title"
            aria-modal="true"
            className="entity-edit__dialog max-h-[90vh] overflow-y-auto"
            role="dialog"
          >
            <header className="entity-edit__header">
              <div>
                <h2 id="quotation-details-title" className="entity-edit__title">
                  تفاصيل المقايسة
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  رقم {detailsQuotation.number}
                </p>
              </div>
              <button
                type="button"
                aria-label="إغلاق التفاصيل"
                className="entity-edit__close"
                onClick={() => setDetailsQuotation(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["المشروع", detailsQuotation.project],
                ["الشركة", detailsQuotation.company],
                ["قيمة الإدارة", `${detailsQuotation.administrationValue} جنيه`],
                ["قيمة الاستشاري", `${detailsQuotation.consultantValue} جنيه`],
                ["المرحلة الحالية", detailsQuotation.stage],
                ["المسؤول الحالي", detailsQuotation.owner],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-[11px] text-slate-500">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {value}
                  </dd>
                </div>
              ))}
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-[11px] text-slate-500">الحالة</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName[detailsQuotation.status] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {detailsQuotation.status}
                  </span>
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
                <dt className="text-[11px] text-slate-500">وصف المقايسة</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {detailsQuotation.description}
                </dd>
              </div>
            </dl>
            <footer className="entity-edit__actions">
              <button
                type="button"
                className="entity-edit__cancel"
                onClick={() => setDetailsQuotation(null)}
              >
                إغلاق
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
