"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDown,
  Eye,
  FileSpreadsheet,
  Plus,
  Printer,
  ReceiptText,
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

type StatementForm = {
  statementNumber: string;
  projectNumber: string;
  projectName: string;
  company: string;
  contractNumber: string;
  type: string;
  stage: string;
  owner: string;
  value: string;
  previousValue: string;
  steelDeduction: string;
  cementDeduction: string;
  materialsDeduction: string;
  insuranceDeduction: string;
  otherDeductions: string;
  netValue: string;
  companyDocuments: string;
  status: string;
};

type StatementRow = StatementForm & {
  id: number;
  discountsTotal: number;
};

const statementTypes = ["جاري 1", "جاري 2", "ختامي", "كلي"];
const stages = ["الكتيبة", "اللواء", "الإدارة", "الهيئة", "الفرع المالي", "الصرف"];
const statuses = ["قيد المتابعة", "قيد المراجعة", "قيد الاعتماد", "تم الصرف", "مرفوض"];

const emptyForm: StatementForm = {
  statementNumber: "",
  projectNumber: "",
  projectName: "",
  company: "",
  contractNumber: "",
  type: "",
  stage: "",
  owner: "",
  value: "",
  previousValue: "",
  steelDeduction: "",
  cementDeduction: "",
  materialsDeduction: "",
  insuranceDeduction: "",
  otherDeductions: "",
  netValue: "",
  companyDocuments: "",
  status: "",
};

const formatCurrency = (value: number | string) =>
  `${Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} جنيه مصري`;

const sumDeductions = (form: StatementForm) =>
  Number(form.steelDeduction || 0) +
  Number(form.cementDeduction || 0) +
  Number(form.materialsDeduction || 0) +
  Number(form.insuranceDeduction || 0) +
  Number(form.otherDeductions || 0);

const columns: DataTableColumn<StatementRow>[] = [
  { key: "statementNumber", label: "رقم المستخلص", width: 120, filterable: false },
  { key: "projectNumber", label: "رقم المشروع", width: 110, filterable: false },
  { key: "projectName", label: "اسم المشروع", width: 165 },
  { key: "company", label: "الشركة", width: 145 },
  { key: "contractNumber", label: "رقم العقد", width: 110, filterable: false },
  { key: "type", label: "نوع المستخلص", width: 115 },
  { key: "stage", label: "المرحلة الحالية", width: 125 },
  { key: "owner", label: "المسؤول الحالي", width: 140, filterable: false },
  {
    key: "value",
    label: "قيمة المستخلص",
    width: 145,
    filterable: false,
    render: (row) => formatCurrency(row.value),
  },
  {
    key: "previousValue",
    label: "السابق",
    width: 140,
    filterable: false,
    render: (row) => formatCurrency(row.previousValue),
  },
  {
    key: "discountsTotal",
    label: "الخصومات",
    width: 145,
    filterable: false,
    render: (row) => formatCurrency(row.discountsTotal),
  },
  {
    key: "netValue",
    label: "الصافي",
    width: 140,
    filterable: false,
    render: (row) => formatCurrency(row.netValue),
  },
  {
    key: "status",
    label: "الحالة",
    width: 125,
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
  "قيد المتابعة": "bg-blue-50 text-blue-700",
  "قيد المراجعة": "bg-amber-50 text-amber-700",
  "قيد الاعتماد": "bg-violet-50 text-violet-700",
  "تم الصرف": "bg-emerald-50 text-emerald-700",
  مرفوض: "bg-red-50 text-red-700",
};

export default function StatementsPage() {
  const [statements, setStatements] = useState<StatementRow[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DataTableFilters<StatementRow>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStatement, setEditingStatement] =
    useState<StatementRow | null>(null);
  const [detailsStatement, setDetailsStatement] =
    useState<StatementRow | null>(null);
  const [form, setForm] = useState<StatementForm>({ ...emptyForm });
  const [formError, setFormError] = useState("");

  const filteredStatements = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");

    return statements.filter((statement) => {
      const matchesSearch =
        !query ||
        Object.values(statement).some((value) =>
          String(value).toLocaleLowerCase("ar").includes(query),
        );
      const matchesFilters = (
        ["projectName", "company", "type", "stage", "status"] as const
      ).every((key) => {
        const selected = filters[key] ?? [];
        return selected.length === 0 || selected.includes(statement[key]);
      });

      return matchesSearch && matchesFilters;
    });
  }, [filters, search, statements]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingStatement(null);
    setFormError("");
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingStatement(null);
    setForm({ ...emptyForm });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (statement: StatementRow) => {
    setEditingStatement(statement);
    setForm({
      statementNumber: statement.statementNumber,
      projectNumber: statement.projectNumber,
      projectName: statement.projectName,
      company: statement.company,
      contractNumber: statement.contractNumber,
      type: statement.type,
      stage: statement.stage,
      owner: statement.owner,
      value: statement.value,
      previousValue: statement.previousValue,
      steelDeduction: statement.steelDeduction,
      cementDeduction: statement.cementDeduction,
      materialsDeduction: statement.materialsDeduction,
      insuranceDeduction: statement.insuranceDeduction,
      otherDeductions: statement.otherDeductions,
      netValue: statement.netValue,
      companyDocuments: statement.companyDocuments,
      status: statement.status,
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

    const savedValues: StatementForm = {
      statementNumber: form.statementNumber.trim(),
      projectNumber: form.projectNumber.trim(),
      projectName: form.projectName.trim(),
      company: form.company.trim(),
      contractNumber: form.contractNumber.trim(),
      type: form.type,
      stage: form.stage,
      owner: form.owner.trim(),
      value: form.value,
      previousValue: form.previousValue,
      steelDeduction: form.steelDeduction,
      cementDeduction: form.cementDeduction,
      materialsDeduction: form.materialsDeduction,
      insuranceDeduction: form.insuranceDeduction,
      otherDeductions: form.otherDeductions,
      netValue: form.netValue,
      companyDocuments: form.companyDocuments.trim(),
      status: form.status,
    };
    const discountsTotal = sumDeductions(savedValues);

    if (editingStatement) {
      setStatements((current) =>
        current.map((statement) =>
          statement.id === editingStatement.id
            ? { ...savedValues, discountsTotal, id: statement.id }
            : statement,
        ),
      );
    } else {
      setStatements((current) => [
        { ...savedValues, discountsTotal, id: Date.now() },
        ...current,
      ]);
    }

    resetForm();
  };

  const handleDelete = (statement: StatementRow) => {
    void confirmDelete(statement.id, async (deleteId) => {
      setStatements((current) =>
        current.filter((item) => item.id !== Number(deleteId)),
      );
    });
  };

  const updateFormField = (field: keyof StatementForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError("");
  };

  const formInputClass =
    "entity-edit__input min-h-10 text-sm focus:border-[#103462] focus:ring-2 focus:ring-[#103462]/10";

  return (
    <main
      dir="rtl"
      className={`data-page${filteredStatements.length ? " data-page--has-rows" : ""}`}
    >
      <header className="data-page__heading">
        <div>
          <h1 className="data-page__title">المستخلصات الجارية</h1>
          <p className="mt-1 text-xs text-slate-500">
            متابعة المستخلصات وقيمها ومراحل اعتمادها وموقفها الحالي.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="data-page__add inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          <span>إضافة مستخلص جديد</span>
        </button>
      </header>

      <section aria-label="جدول المستخلصات الجارية" className="data-page__card">
        <div className="data-page__toolbar">
          <label className="data-page__search">
            <input
              type="search"
              placeholder="بحث في المستخلصات..."
              aria-label="بحث في المستخلصات"
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

        {statements.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
            <span className="data-page__empty-icon">
              <ReceiptText size={24} aria-hidden="true" />
            </span>
            <p className="data-page__empty-message mt-3">
              لا توجد مستخلصات مضافة حتى الآن
            </p>
            <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
              أضف مستخلصًا لعرضه هنا. لا توجد بيانات مستخلصات مرتبطة بقاعدة
              بيانات أو API في المشروع حاليًا.
            </p>
            <button
              type="button"
              onClick={openAddForm}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#103462] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17477f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462] focus-visible:ring-offset-2"
            >
              <Plus size={15} aria-hidden="true" />
              إضافة مستخلص
            </button>
          </div>
        ) : (
          <DataTable<StatementRow>
            columns={columns}
            rows={filteredStatements}
            sourceRows={statements}
            filters={filters}
            onFiltersChange={setFilters}
            actionsWidth={135}
            emptyIcon={<Search size={22} />}
            emptyText="لا توجد نتائج مطابقة للبحث أو الفلاتر"
            renderActions={(statement) => (
              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  title="عرض التفاصيل"
                  aria-label={`عرض تفاصيل المستخلص ${statement.statementNumber}`}
                  onClick={() => setDetailsStatement(statement)}
                  className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#103462] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462]"
                >
                  <Eye size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="تعديل"
                  aria-label={`تعديل المستخلص ${statement.statementNumber}`}
                  onClick={() => openEditForm(statement)}
                  className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="حذف"
                  aria-label={`حذف المستخلص ${statement.statementNumber}`}
                  onClick={() => handleDelete(statement)}
                  className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            )}
          />
        )}

        {statements.length > 0 && (
          <footer className="data-page__footer">
            <span>
              عدد المستخلصات: {filteredStatements.length}
              {filteredStatements.length !== statements.length &&
                ` من ${statements.length}`}
            </span>
            <span className="data-page__result-status">
              <ArrowDown size={13} aria-hidden="true" />
              {filteredStatements.length > 0
                ? `عرض ${filteredStatements.length} مستخلص`
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
            aria-labelledby="statement-form-title"
            aria-modal="true"
            className="entity-edit__dialog max-h-[90vh] w-full max-w-4xl overflow-y-auto"
            onSubmit={handleSave}
            role="dialog"
          >
            <header className="entity-edit__header">
              <div>
                <h2 id="statement-form-title" className="entity-edit__title">
                  {editingStatement ? "تعديل المستخلص" : "إضافة مستخلص جديد"}
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
                رقم المستخلص *
                <input
                  autoFocus
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
                رقم المشروع *
                <input
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
                نوع المستخلص *
                <select
                  required
                  className={formInputClass}
                  value={form.type}
                  onChange={(event) => updateFormField("type", event.target.value)}
                >
                  <option value="">اختر نوع المستخلص</option>
                  {statementTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
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
                قيمة المستخلص (جنيه مصري) *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  className={formInputClass}
                  value={form.value}
                  onChange={(event) => updateFormField("value", event.target.value)}
                  placeholder="0.00"
                />
              </label>
              <label className="entity-edit__label">
                السابق (جنيه مصري) *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  className={formInputClass}
                  value={form.previousValue}
                  onChange={(event) =>
                    updateFormField("previousValue", event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>
              <label className="entity-edit__label">
                خصم الحديد (جنيه مصري) *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  className={formInputClass}
                  value={form.steelDeduction}
                  onChange={(event) =>
                    updateFormField("steelDeduction", event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>
              <label className="entity-edit__label">
                خصم الأسمنت (جنيه مصري) *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  className={formInputClass}
                  value={form.cementDeduction}
                  onChange={(event) =>
                    updateFormField("cementDeduction", event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>
              <label className="entity-edit__label">
                خصم خامات أخرى (جنيه مصري) *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  className={formInputClass}
                  value={form.materialsDeduction}
                  onChange={(event) =>
                    updateFormField("materialsDeduction", event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>
              <label className="entity-edit__label">
                التأمينات (جنيه مصري) *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  className={formInputClass}
                  value={form.insuranceDeduction}
                  onChange={(event) =>
                    updateFormField("insuranceDeduction", event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>
              <label className="entity-edit__label">
                خصومات أخرى (جنيه مصري) *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  className={formInputClass}
                  value={form.otherDeductions}
                  onChange={(event) =>
                    updateFormField("otherDeductions", event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>
              <label className="entity-edit__label">
                صافي المستخلص (جنيه مصري) *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  className={formInputClass}
                  value={form.netValue}
                  onChange={(event) =>
                    updateFormField("netValue", event.target.value)
                  }
                  placeholder="أدخله وفق قاعدة الحساب المعتمدة"
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
              <label className="entity-edit__label sm:col-span-2">
                المستندات المطلوبة من الشركة
                <textarea
                  rows={2}
                  className={`${formInputClass} resize-y`}
                  value={form.companyDocuments}
                  onChange={(event) =>
                    updateFormField("companyDocuments", event.target.value)
                  }
                  placeholder="أدخل المستندات المطلوبة، إن وجدت"
                />
              </label>
            </div>

            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-500">
              إجمالي الخصومات المعروض هو مجموع بنود الخصم المدخلة. صافي
              المستخلص لا يُحسب تلقائيًا لعدم توفر القاعدة المالية المرجعية.
            </p>

            <footer className="entity-edit__actions">
              <button
                type="button"
                className="entity-edit__cancel"
                onClick={resetForm}
              >
                إلغاء
              </button>
              <button type="submit" className="entity-edit__save">
                {editingStatement ? "حفظ التعديلات" : "إضافة المستخلص"}
              </button>
            </footer>
          </form>
        </div>
      )}

      {detailsStatement && (
        <div
          className="entity-edit__overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailsStatement(null);
          }}
        >
          <section
            aria-labelledby="statement-details-title"
            aria-modal="true"
            className="entity-edit__dialog max-h-[90vh] overflow-y-auto"
            role="dialog"
          >
            <header className="entity-edit__header">
              <div>
                <h2 id="statement-details-title" className="entity-edit__title">
                  تفاصيل المستخلص
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  رقم المستخلص {detailsStatement.statementNumber}
                </p>
              </div>
              <button
                type="button"
                aria-label="إغلاق التفاصيل"
                className="entity-edit__close"
                onClick={() => setDetailsStatement(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["رقم المشروع", detailsStatement.projectNumber],
                ["اسم المشروع", detailsStatement.projectName],
                ["الشركة", detailsStatement.company],
                ["رقم العقد", detailsStatement.contractNumber],
                ["نوع المستخلص", detailsStatement.type],
                ["المرحلة الحالية", detailsStatement.stage],
                ["المسؤول الحالي", detailsStatement.owner],
                ["قيمة المستخلص", formatCurrency(detailsStatement.value)],
                ["السابق", formatCurrency(detailsStatement.previousValue)],
                ["خصم الحديد", formatCurrency(detailsStatement.steelDeduction)],
                ["خصم الأسمنت", formatCurrency(detailsStatement.cementDeduction)],
                ["خصم خامات أخرى", formatCurrency(detailsStatement.materialsDeduction)],
                ["التأمينات", formatCurrency(detailsStatement.insuranceDeduction)],
                ["خصومات أخرى", formatCurrency(detailsStatement.otherDeductions)],
                ["إجمالي الخصومات", formatCurrency(detailsStatement.discountsTotal)],
                ["صافي المستخلص", formatCurrency(detailsStatement.netValue)],
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
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName[detailsStatement.status] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {detailsStatement.status}
                  </span>
                </dd>
              </div>
              {detailsStatement.companyDocuments && (
                <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
                  <dt className="text-[11px] text-slate-500">
                    المستندات المطلوبة من الشركة
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                    {detailsStatement.companyDocuments}
                  </dd>
                </div>
              )}
            </dl>
            <footer className="entity-edit__actions">
              <button
                type="button"
                className="entity-edit__cancel"
                onClick={() => setDetailsStatement(null)}
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
