"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDown,
  Eye,
  FileSpreadsheet,
  Package,
  Plus,
  Printer,
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

type DeductionForm = {
  projectNumber: string;
  projectName: string;
  contractNumber: string;
  company: string;
  statementNumber: string;
  materialType: string;
  quantity: string;
  unit: string;
  deductionDate: string;
  status: string;
};

type DeductionRow = DeductionForm & {
  id: number;
};

const materialTypes = ["الحديد", "الأسمنت", "الطوب", "الخرسانة"];
const statuses = ["مسجل", "قيد المراجعة", "ملغي"];

const emptyForm: DeductionForm = {
  projectNumber: "",
  projectName: "",
  contractNumber: "",
  company: "",
  statementNumber: "",
  materialType: "",
  quantity: "",
  unit: "",
  deductionDate: "",
  status: "",
};

const columns: DataTableColumn<DeductionRow>[] = [
  { key: "projectNumber", label: "رقم المشروع", width: 120, filterable: false },
  { key: "projectName", label: "اسم المشروع", width: 180 },
  { key: "contractNumber", label: "رقم العقد", width: 125 },
  { key: "company", label: "اسم الشركة", width: 160 },
  { key: "statementNumber", label: "رقم المستخلص", width: 135 },
  { key: "materialType", label: "نوع الخامة", width: 125 },
  { key: "quantity", label: "الكمية المخصومة", width: 130, filterable: false },
  { key: "unit", label: "الوحدة", width: 95, filterable: false },
  {
    key: "deductionDate",
    label: "تاريخ الخصم",
    width: 125,
    filterable: false,
    render: (row) =>
      new Date(`${row.deductionDate}T00:00:00`).toLocaleDateString("ar-EG"),
  },
  {
    key: "status",
    label: "الحالة",
    width: 110,
    render: (row) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClassName[row.status] ?? "bg-slate-100 text-slate-700"}`}
      >
        {row.status}
      </span>
    ),
  },
];

const statusClassName: Record<string, string> = {
  مسجل: "bg-blue-50 text-blue-700",
  "قيد المراجعة": "bg-amber-50 text-amber-700",
  ملغي: "bg-red-50 text-red-700",
};

export default function DeductedMaterialsPage() {
  const [deductions, setDeductions] = useState<DeductionRow[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DataTableFilters<DeductionRow>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeduction, setEditingDeduction] =
    useState<DeductionRow | null>(null);
  const [detailsDeduction, setDetailsDeduction] =
    useState<DeductionRow | null>(null);
  const [form, setForm] = useState<DeductionForm>({ ...emptyForm });
  const [formError, setFormError] = useState("");

  const filteredDeductions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");

    return deductions.filter((deduction) => {
      const matchesSearch =
        !query ||
        Object.values(deduction).some((value) =>
          String(value).toLocaleLowerCase("ar").includes(query),
        );
      const matchesFilters = (
        [
          "projectName",
          "contractNumber",
          "company",
          "statementNumber",
          "materialType",
        ] as const
      ).every((key) => {
        const selected = filters[key] ?? [];
        return selected.length === 0 || selected.includes(deduction[key]);
      });

      return matchesSearch && matchesFilters;
    });
  }, [deductions, filters, search]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingDeduction(null);
    setFormError("");
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingDeduction(null);
    setForm({ ...emptyForm });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (deduction: DeductionRow) => {
    setEditingDeduction(deduction);
    setForm({
      projectNumber: deduction.projectNumber,
      projectName: deduction.projectName,
      contractNumber: deduction.contractNumber,
      company: deduction.company,
      statementNumber: deduction.statementNumber,
      materialType: deduction.materialType,
      quantity: deduction.quantity,
      unit: deduction.unit,
      deductionDate: deduction.deductionDate,
      status: deduction.status,
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

    const savedValues: DeductionForm = {
      projectNumber: form.projectNumber.trim(),
      projectName: form.projectName.trim(),
      contractNumber: form.contractNumber.trim(),
      company: form.company.trim(),
      statementNumber: form.statementNumber.trim(),
      materialType: form.materialType,
      quantity: form.quantity,
      unit: form.unit.trim(),
      deductionDate: form.deductionDate,
      status: form.status,
    };

    if (editingDeduction) {
      setDeductions((current) =>
        current.map((deduction) =>
          deduction.id === editingDeduction.id
            ? { ...savedValues, id: deduction.id }
            : deduction,
        ),
      );
    } else {
      setDeductions((current) => [
        { ...savedValues, id: Date.now() },
        ...current,
      ]);
    }

    resetForm();
  };

  const handleDelete = (deduction: DeductionRow) => {
    void confirmDelete(deduction.id, async (deleteId) => {
      setDeductions((current) =>
        current.filter((item) => item.id !== Number(deleteId)),
      );
    });
  };

  const updateFormField = (field: keyof DeductionForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError("");
  };

  const formInputClass =
    "entity-edit__input min-h-10 text-sm focus:border-[#103462] focus:ring-2 focus:ring-[#103462]/10";

  return (
    <main
      dir="rtl"
      className={`data-page${filteredDeductions.length ? " data-page--has-rows" : ""}`}
    >
      <header className="data-page__heading">
        <div>
          <h1 className="data-page__title">الخامات المخصومة</h1>
          <p className="mt-1 text-xs text-slate-500">
            متابعة كميات الخامات المخصومة وربطها بالمشروعات والعقود والمستخلصات.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="data-page__add inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          <span>إضافة خامة مخصومة</span>
        </button>
      </header>

      <section aria-label="جدول الخامات المخصومة" className="data-page__card">
        <div className="data-page__toolbar">
          <label className="data-page__search">
            <input
              type="search"
              placeholder="بحث في الخامات المخصومة..."
              aria-label="بحث في الخامات المخصومة"
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

        {deductions.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
            <span className="data-page__empty-icon">
              <Package size={24} aria-hidden="true" />
            </span>
            <p className="data-page__empty-message mt-3">
              لا توجد خامات مخصومة لعرضها
            </p>
            <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
              ستظهر هنا الخصومات بعد ربطها بالمستخلصات، أو يمكنك إضافة سجل مؤقت
              يدويًا.
            </p>
            <button
              type="button"
              onClick={openAddForm}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#103462] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17477f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462] focus-visible:ring-offset-2"
            >
              <Plus size={15} aria-hidden="true" />
              إضافة خامة مخصومة
            </button>
          </div>
        ) : (
          <DataTable<DeductionRow>
            columns={columns}
            rows={filteredDeductions}
            sourceRows={deductions}
            filters={filters}
            onFiltersChange={setFilters}
            actionsWidth={135}
            emptyIcon={<Search size={22} />}
            emptyText="لا توجد نتائج مطابقة للبحث أو الفلاتر"
            renderActions={(deduction) => (
              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  title="عرض التفاصيل"
                  aria-label={`عرض تفاصيل خصم ${deduction.materialType} للمستخلص ${deduction.statementNumber}`}
                  onClick={() => setDetailsDeduction(deduction)}
                  className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#103462] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462]"
                >
                  <Eye size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="تعديل"
                  aria-label={`تعديل خصم ${deduction.materialType} للمستخلص ${deduction.statementNumber}`}
                  onClick={() => openEditForm(deduction)}
                  className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="حذف"
                  aria-label={`حذف خصم ${deduction.materialType} للمستخلص ${deduction.statementNumber}`}
                  onClick={() => handleDelete(deduction)}
                  className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            )}
          />
        )}

        {deductions.length > 0 && (
          <footer className="data-page__footer">
            <span>
              عدد سجلات الخصم: {filteredDeductions.length}
              {filteredDeductions.length !== deductions.length &&
                ` من ${deductions.length}`}
            </span>
            <span className="data-page__result-status">
              <ArrowDown size={13} aria-hidden="true" />
              {filteredDeductions.length > 0
                ? `عرض ${filteredDeductions.length} سجل`
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
            aria-labelledby="deduction-form-title"
            aria-modal="true"
            className="entity-edit__dialog max-h-[90vh] w-full max-w-3xl overflow-y-auto"
            onSubmit={handleSave}
            role="dialog"
          >
            <header className="entity-edit__header">
              <div>
                <h2 id="deduction-form-title" className="entity-edit__title">
                  {editingDeduction
                    ? "تعديل خامة مخصومة"
                    : "إضافة خامة مخصومة"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  الحقول المشار إليها مطلوبة. السجل مؤقت ولا يرتبط حاليًا
                  بالمستخلص تلقائيًا.
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
                رقم المشروع *
                <input
                  autoFocus
                  required
                  className={formInputClass}
                  value={form.projectNumber}
                  onChange={(event) =>
                    updateFormField("projectNumber", event.target.value)
                  }
                  placeholder="أدخل رقم المشروع"
                />
              </label>
              <label className="entity-edit__label">
                اسم المشروع *
                <input
                  required
                  className={formInputClass}
                  value={form.projectName}
                  onChange={(event) =>
                    updateFormField("projectName", event.target.value)
                  }
                  placeholder="أدخل اسم المشروع"
                />
              </label>
              <label className="entity-edit__label">
                رقم العقد *
                <input
                  required
                  className={formInputClass}
                  value={form.contractNumber}
                  onChange={(event) =>
                    updateFormField("contractNumber", event.target.value)
                  }
                  placeholder="أدخل رقم العقد"
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
                رقم المستخلص *
                <input
                  required
                  className={formInputClass}
                  value={form.statementNumber}
                  onChange={(event) =>
                    updateFormField("statementNumber", event.target.value)
                  }
                  placeholder="أدخل رقم المستخلص"
                />
              </label>
              <label className="entity-edit__label">
                نوع الخامة *
                <select
                  required
                  className={formInputClass}
                  value={form.materialType}
                  onChange={(event) =>
                    updateFormField("materialType", event.target.value)
                  }
                >
                  <option value="">اختر نوع الخامة</option>
                  {materialTypes.map((materialType) => (
                    <option key={materialType} value={materialType}>
                      {materialType}
                    </option>
                  ))}
                </select>
              </label>
              <label className="entity-edit__label">
                الكمية المخصومة *
                <input
                  required
                  min="0"
                  step="0.001"
                  type="number"
                  className={formInputClass}
                  value={form.quantity}
                  onChange={(event) =>
                    updateFormField("quantity", event.target.value)
                  }
                  placeholder="أدخل الكمية"
                />
              </label>
              <label className="entity-edit__label">
                الوحدة *
                <input
                  required
                  className={formInputClass}
                  value={form.unit}
                  onChange={(event) => updateFormField("unit", event.target.value)}
                  placeholder="أدخل الوحدة"
                />
              </label>
              <label className="entity-edit__label">
                تاريخ الخصم *
                <input
                  required
                  type="date"
                  className={formInputClass}
                  value={form.deductionDate}
                  onChange={(event) =>
                    updateFormField("deductionDate", event.target.value)
                  }
                />
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
                {editingDeduction ? "حفظ التعديلات" : "إضافة الخصم"}
              </button>
            </footer>
          </form>
        </div>
      )}

      {detailsDeduction && (
        <div
          className="entity-edit__overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailsDeduction(null);
          }}
        >
          <section
            aria-labelledby="deduction-details-title"
            aria-modal="true"
            className="entity-edit__dialog max-h-[90vh] overflow-y-auto"
            role="dialog"
          >
            <header className="entity-edit__header">
              <div>
                <h2 id="deduction-details-title" className="entity-edit__title">
                  تفاصيل الخامة المخصومة
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {detailsDeduction.materialType} — المستخلص رقم{" "}
                  {detailsDeduction.statementNumber}
                </p>
              </div>
              <button
                type="button"
                aria-label="إغلاق التفاصيل"
                className="entity-edit__close"
                onClick={() => setDetailsDeduction(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["رقم المشروع", detailsDeduction.projectNumber],
                ["اسم المشروع", detailsDeduction.projectName],
                ["رقم العقد", detailsDeduction.contractNumber],
                ["الشركة", detailsDeduction.company],
                ["رقم المستخلص", detailsDeduction.statementNumber],
                ["نوع الخامة", detailsDeduction.materialType],
                [
                  "الكمية المخصومة",
                  `${Number(detailsDeduction.quantity).toLocaleString("en-US")} ${detailsDeduction.unit}`,
                ],
                [
                  "تاريخ الخصم",
                  new Date(
                    `${detailsDeduction.deductionDate}T00:00:00`,
                  ).toLocaleDateString("ar-EG"),
                ],
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
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName[detailsDeduction.status] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {detailsDeduction.status}
                  </span>
                </dd>
              </div>
            </dl>
            <footer className="entity-edit__actions">
              <button
                type="button"
                className="entity-edit__cancel"
                onClick={() => setDetailsDeduction(null)}
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
