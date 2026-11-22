"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDown,
  Eye,
  FileSignature,
  FileSpreadsheet,
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

type ContractForm = {
  contractNumber: string;
  projectNumber: string;
  projectName: string;
  company: string;
  contractValue: string;
  commitmentValue: string;
  spentValue: string;
  status: string;
};

type ContractRow = ContractForm & {
  id: number;
  remainingCommitment: number;
};

const statuses = ["ساري", "قيد التنفيذ", "مكتمل", "موقوف"];

const emptyForm: ContractForm = {
  contractNumber: "",
  projectNumber: "",
  projectName: "",
  company: "",
  contractValue: "",
  commitmentValue: "",
  spentValue: "",
  status: "",
};

const formatCurrency = (value: number | string) =>
  `${Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} جنيه مصري`;

const columns: DataTableColumn<ContractRow>[] = [
  { key: "contractNumber", label: "رقم العقد", width: 110 },
  { key: "projectNumber", label: "رقم المشروع", width: 110 },
  { key: "projectName", label: "اسم المشروع", width: 175 },
  { key: "company", label: "اسم الشركة", width: 160 },
  {
    key: "contractValue",
    label: "قيمة العقد",
    width: 145,
    filterable: false,
    render: (row) => formatCurrency(row.contractValue),
  },
  {
    key: "commitmentValue",
    label: "قيمة الارتباط",
    width: 145,
    filterable: false,
    render: (row) => formatCurrency(row.commitmentValue),
  },
  {
    key: "spentValue",
    label: "قيمة الصرف",
    width: 145,
    filterable: false,
    render: (row) => formatCurrency(row.spentValue),
  },
  {
    key: "remainingCommitment",
    label: "المتبقي من الارتباط",
    width: 155,
    filterable: false,
    render: (row) => (
      <span
        className={
          row.remainingCommitment < 0
            ? "font-semibold text-red-600"
            : "font-medium text-slate-700"
        }
      >
        {formatCurrency(row.remainingCommitment)}
      </span>
    ),
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
  ساري: "bg-blue-50 text-blue-700",
  "قيد التنفيذ": "bg-amber-50 text-amber-700",
  مكتمل: "bg-emerald-50 text-emerald-700",
  موقوف: "bg-red-50 text-red-700",
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DataTableFilters<ContractRow>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractRow | null>(
    null,
  );
  const [detailsContract, setDetailsContract] = useState<ContractRow | null>(
    null,
  );
  const [form, setForm] = useState<ContractForm>({ ...emptyForm });
  const [formError, setFormError] = useState("");

  const filteredContracts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");

    return contracts.filter((contract) => {
      const matchesSearch =
        !query ||
        Object.values(contract).some((value) =>
          String(value).toLocaleLowerCase("ar").includes(query),
        );
      const matchesFilters = (
        ["contractNumber", "projectNumber", "projectName", "company", "status"] as const
      ).every((key) => {
        const selected = filters[key] ?? [];
        return selected.length === 0 || selected.includes(contract[key]);
      });

      return matchesSearch && matchesFilters;
    });
  }, [contracts, filters, search]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingContract(null);
    setFormError("");
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingContract(null);
    setForm({ ...emptyForm });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (contract: ContractRow) => {
    setEditingContract(contract);
    setForm({
      contractNumber: contract.contractNumber,
      projectNumber: contract.projectNumber,
      projectName: contract.projectName,
      company: contract.company,
      contractValue: contract.contractValue,
      commitmentValue: contract.commitmentValue,
      spentValue: contract.spentValue,
      status: contract.status,
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

    const savedValues: ContractForm = {
      contractNumber: form.contractNumber.trim(),
      projectNumber: form.projectNumber.trim(),
      projectName: form.projectName.trim(),
      company: form.company.trim(),
      contractValue: form.contractValue,
      commitmentValue: form.commitmentValue,
      spentValue: form.spentValue,
      status: form.status,
    };
    const remainingCommitment =
      Number(savedValues.commitmentValue) - Number(savedValues.spentValue);

    if (editingContract) {
      setContracts((current) =>
        current.map((contract) =>
          contract.id === editingContract.id
            ? { ...savedValues, remainingCommitment, id: contract.id }
            : contract,
        ),
      );
    } else {
      setContracts((current) => [
        { ...savedValues, remainingCommitment, id: Date.now() },
        ...current,
      ]);
    }

    resetForm();
  };

  const handleDelete = (contract: ContractRow) => {
    void confirmDelete(contract.id, async (deleteId) => {
      setContracts((current) =>
        current.filter((item) => item.id !== Number(deleteId)),
      );
    });
  };

  const updateFormField = (field: keyof ContractForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError("");
  };

  const formInputClass =
    "entity-edit__input min-h-10 text-sm focus:border-[#103462] focus:ring-2 focus:ring-[#103462]/10";

  return (
    <main
      dir="rtl"
      className={`data-page${filteredContracts.length ? " data-page--has-rows" : ""}`}
    >
      <header className="data-page__heading">
        <div>
          <h1 className="data-page__title">العقود والارتباط</h1>
          <p className="mt-1 text-xs text-slate-500">
            متابعة بيانات العقود وقيم الارتباط والموقف المالي للمشروعات والشركات.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="data-page__add inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          <span>إضافة عقد جديد</span>
        </button>
      </header>

      <section aria-label="جدول العقود والارتباط" className="data-page__card">
        <div className="data-page__toolbar">
          <label className="data-page__search">
            <input
              type="search"
              placeholder="بحث في العقود..."
              aria-label="بحث في العقود"
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

        {contracts.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
            <span className="data-page__empty-icon">
              <FileSignature size={24} aria-hidden="true" />
            </span>
            <p className="data-page__empty-message mt-3">
              لا توجد عقود مضافة حتى الآن
            </p>
            <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
              أضف عقدًا لعرضه هنا. لا توجد بيانات عقود مرتبطة بقاعدة بيانات أو API
              في المشروع حاليًا، والإضافات الحالية مؤقتة لهذه الجلسة.
            </p>
            <button
              type="button"
              onClick={openAddForm}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#103462] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17477f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462] focus-visible:ring-offset-2"
            >
              <Plus size={15} aria-hidden="true" />
              إضافة عقد
            </button>
          </div>
        ) : (
          <DataTable<ContractRow>
            columns={columns}
            rows={filteredContracts}
            sourceRows={contracts}
            filters={filters}
            onFiltersChange={setFilters}
            actionsWidth={135}
            emptyIcon={<Search size={22} />}
            emptyText="لا توجد نتائج مطابقة للبحث أو الفلاتر"
            renderActions={(contract) => (
              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  title="عرض التفاصيل"
                  aria-label={`عرض تفاصيل العقد ${contract.contractNumber}`}
                  onClick={() => setDetailsContract(contract)}
                  className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#103462] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462]"
                >
                  <Eye size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="تعديل"
                  aria-label={`تعديل العقد ${contract.contractNumber}`}
                  onClick={() => openEditForm(contract)}
                  className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="حذف"
                  aria-label={`حذف العقد ${contract.contractNumber}`}
                  onClick={() => handleDelete(contract)}
                  className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            )}
          />
        )}

        {contracts.length > 0 && (
          <footer className="data-page__footer">
            <span>
              عدد العقود: {filteredContracts.length}
              {filteredContracts.length !== contracts.length &&
                ` من ${contracts.length}`}
            </span>
            <span className="data-page__result-status">
              <ArrowDown size={13} aria-hidden="true" />
              {filteredContracts.length > 0
                ? `عرض ${filteredContracts.length} عقد`
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
            aria-labelledby="contract-form-title"
            aria-modal="true"
            className="entity-edit__dialog max-h-[90vh] w-full max-w-3xl overflow-y-auto"
            onSubmit={handleSave}
            role="dialog"
          >
            <header className="entity-edit__header">
              <div>
                <h2 id="contract-form-title" className="entity-edit__title">
                  {editingContract ? "تعديل العقد" : "إضافة عقد جديد"}
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
                رقم العقد *
                <input
                  autoFocus
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
                اسم الشركة *
                <input
                  required
                  className={formInputClass}
                  value={form.company}
                  onChange={(event) => updateFormField("company", event.target.value)}
                  placeholder="أدخل اسم الشركة"
                />
              </label>
              <label className="entity-edit__label">
                قيمة العقد (جنيه مصري) *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  className={formInputClass}
                  value={form.contractValue}
                  onChange={(event) =>
                    updateFormField("contractValue", event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>
              <label className="entity-edit__label">
                قيمة الارتباط (جنيه مصري) *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  className={formInputClass}
                  value={form.commitmentValue}
                  onChange={(event) =>
                    updateFormField("commitmentValue", event.target.value)
                  }
                  placeholder="0.00"
                />
              </label>
              <label className="entity-edit__label">
                قيمة الصرف (جنيه مصري) *
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  className={formInputClass}
                  value={form.spentValue}
                  onChange={(event) => updateFormField("spentValue", event.target.value)}
                  placeholder="0.00"
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
                {editingContract ? "حفظ التعديلات" : "إضافة العقد"}
              </button>
            </footer>
          </form>
        </div>
      )}

      {detailsContract && (
        <div
          className="entity-edit__overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailsContract(null);
          }}
        >
          <section
            aria-labelledby="contract-details-title"
            aria-modal="true"
            className="entity-edit__dialog max-h-[90vh] overflow-y-auto"
            role="dialog"
          >
            <header className="entity-edit__header">
              <div>
                <h2 id="contract-details-title" className="entity-edit__title">
                  تفاصيل العقد
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  رقم العقد {detailsContract.contractNumber}
                </p>
              </div>
              <button
                type="button"
                aria-label="إغلاق التفاصيل"
                className="entity-edit__close"
                onClick={() => setDetailsContract(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["رقم المشروع", detailsContract.projectNumber],
                ["اسم المشروع", detailsContract.projectName],
                ["اسم الشركة", detailsContract.company],
                ["قيمة العقد", formatCurrency(detailsContract.contractValue)],
                ["قيمة الارتباط", formatCurrency(detailsContract.commitmentValue)],
                ["قيمة الصرف", formatCurrency(detailsContract.spentValue)],
                [
                  "المتبقي من الارتباط",
                  formatCurrency(detailsContract.remainingCommitment),
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
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName[detailsContract.status] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {detailsContract.status}
                  </span>
                </dd>
              </div>
            </dl>
            <footer className="entity-edit__actions">
              <button
                type="button"
                className="entity-edit__cancel"
                onClick={() => setDetailsContract(null)}
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
