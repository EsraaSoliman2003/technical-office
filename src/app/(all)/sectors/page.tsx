"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDown,
  Briefcase,
  Eye,
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

type SectorStatus = "نشط" | "غير نشط";

type SectorForm = {
  code: string;
  name: string;
  description: string;
  status: SectorStatus | "";
};

type SectorRow = SectorForm & {
  id: number;
  projectCount: number | null;
};

const emptyForm: SectorForm = {
  code: "",
  name: "",
  description: "",
  status: "",
};

const columns: DataTableColumn<SectorRow>[] = [
  { key: "code", label: "كود القطاع", width: 140 },
  { key: "name", label: "اسم القطاع", width: 190 },
  { key: "description", label: "وصف القطاع", width: "calc(35% - 150px)", filterable: false },
  {
    key: "projectCount",
    label: "المشروعات التابعة",
    width: 160,
    filterable: false,
    render: (row) =>
      row.projectCount === null ? (
        <span className="text-slate-400">غير متاح</span>
      ) : (
        row.projectCount.toLocaleString("ar-EG")
      ),
  },
  {
    key: "status",
    label: "الحالة",
    width: 120,
    render: (row) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          row.status === "نشط"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {row.status}
      </span>
    ),
  },
];

export default function SectorsPage() {
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DataTableFilters<SectorRow>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<SectorRow | null>(null);
  const [detailsSector, setDetailsSector] = useState<SectorRow | null>(null);
  const [form, setForm] = useState<SectorForm>({ ...emptyForm });
  const [formError, setFormError] = useState("");

  const filteredSectors = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");

    return sectors.filter((sector) => {
      const matchesSearch =
        !query ||
        [sector.code, sector.name, sector.description].some((value) =>
          value.toLocaleLowerCase("ar").includes(query),
        );
      const selectedStatuses = filters.status ?? [];
      const matchesStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(sector.status);

      return matchesSearch && matchesStatus;
    });
  }, [filters.status, search, sectors]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingSector(null);
    setFormError("");
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingSector(null);
    setForm({ ...emptyForm });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (sector: SectorRow) => {
    setEditingSector(sector);
    setForm({
      code: sector.code,
      name: sector.name,
      description: sector.description,
      status: sector.status,
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!event.currentTarget.reportValidity()) {
      setFormError("يرجى استكمال الحقول المطلوبة.");
      return;
    }

    const normalizedCode = form.code.trim().toLocaleLowerCase("ar");
    const normalizedName = form.name.trim().toLocaleLowerCase("ar");
    const duplicateSector = sectors.some(
      (sector) =>
        sector.id !== editingSector?.id &&
        (sector.code.trim().toLocaleLowerCase("ar") === normalizedCode ||
          sector.name.trim().toLocaleLowerCase("ar") === normalizedName),
    );

    if (duplicateSector) {
      setFormError("كود القطاع أو اسمه مستخدم بالفعل.");
      return;
    }

    const savedValues = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status as SectorStatus,
    };

    if (editingSector) {
      setSectors((current) =>
        current.map((sector) =>
          sector.id === editingSector.id
            ? { ...sector, ...savedValues }
            : sector,
        ),
      );
    } else {
      setSectors((current) => [
        { ...savedValues, id: Date.now(), projectCount: null },
        ...current,
      ]);
    }

    resetForm();
  };

  const handleDelete = (sector: SectorRow) => {
    if (sector.projectCount === null) {
      setFormError("تعذر التحقق من ارتباط القطاع بالمشروعات؛ الحذف غير متاح حاليًا.");
      return;
    }

    if (sector.projectCount !== null && sector.projectCount > 0) {
      setFormError("لا يمكن حذف قطاع مرتبط بمشروعات.");
      return;
    }

    void confirmDelete(sector.id, async (deleteId) => {
      setSectors((current) =>
        current.filter((item) => item.id !== Number(deleteId)),
      );
    });
  };

  const updateFormField = (
    field: keyof SectorForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    if (formError) setFormError("");
  };

  const formInputClass =
    "entity-edit__input min-h-10 text-sm focus:border-[#103462] focus:ring-2 focus:ring-[#103462]/10";

  return (
    <main
      dir="rtl"
      className={`data-page${filteredSectors.length ? " data-page--has-rows" : ""}`}
    >
      <header className="data-page__heading">
        <div>
          <h1 className="data-page__title">القطاعات</h1>
          <p className="mt-1 text-xs text-slate-500">
            إدارة بيانات القطاعات وربطها بالمشروعات داخل منظومة المكتب الفني.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="data-page__add inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          <span>إضافة قطاع جديد</span>
        </button>
      </header>

      <section aria-label="جدول القطاعات" className="data-page__card">
        <div className="data-page__toolbar">
          <label className="data-page__search">
            <input
              type="search"
              placeholder="بحث في القطاعات..."
              aria-label="بحث في القطاعات"
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
              onClick={openAddForm}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#103462] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17477f] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462] focus-visible:ring-offset-2"
            >
              <Plus size={15} aria-hidden="true" />
              إضافة قطاع
            </button>
          </div>
        ) : (
          <DataTable<SectorRow>
            columns={columns}
            rows={filteredSectors}
            sourceRows={sectors}
            filters={filters}
            onFiltersChange={setFilters}
            actionsWidth={135}
            emptyIcon={<Search size={22} />}
            emptyText="لا توجد قطاعات مطابقة للبحث أو الفلاتر"
            renderActions={(sector) => (
              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  title="عرض التفاصيل"
                  aria-label={`عرض تفاصيل القطاع ${sector.name}`}
                  onClick={() => setDetailsSector(sector)}
                  className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#103462] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462]"
                >
                  <Eye size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title="تعديل"
                  aria-label={`تعديل القطاع ${sector.name}`}
                  onClick={() => openEditForm(sector)}
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
                  onClick={() => handleDelete(sector)}
                  disabled={sector.projectCount === null || sector.projectCount > 0}
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

      {isFormOpen && (
        <div
          className="entity-edit__overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) resetForm();
          }}
        >
          <form
            aria-labelledby="sector-form-title"
            aria-modal="true"
            className="entity-edit__dialog max-h-[90vh] w-full max-w-2xl overflow-y-auto"
            onSubmit={handleSave}
            role="dialog"
          >
            <header className="entity-edit__header">
              <div>
                <h2 id="sector-form-title" className="entity-edit__title">
                  {editingSector ? "تعديل القطاع" : "إضافة قطاع جديد"}
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
                كود القطاع *
                <input
                  autoFocus
                  required
                  className={formInputClass}
                  value={form.code}
                  onChange={(event) => updateFormField("code", event.target.value)}
                  placeholder="أدخل كود القطاع"
                />
              </label>
              <label className="entity-edit__label">
                اسم القطاع *
                <input
                  required
                  className={formInputClass}
                  value={form.name}
                  onChange={(event) => updateFormField("name", event.target.value)}
                  placeholder="أدخل اسم القطاع"
                />
              </label>
              <label className="entity-edit__label">
                الحالة *
                <select
                  required
                  className={formInputClass}
                  value={form.status}
                  onChange={(event) =>
                    updateFormField("status", event.target.value)
                  }
                >
                  <option value="">اختر الحالة</option>
                  <option value="نشط">نشط</option>
                  <option value="غير نشط">غير نشط</option>
                </select>
              </label>
              <label className="entity-edit__label sm:col-span-2">
                وصف القطاع
                <textarea
                  rows={3}
                  className={`${formInputClass} resize-y`}
                  value={form.description}
                  onChange={(event) =>
                    updateFormField("description", event.target.value)
                  }
                  placeholder="أدخل وصف القطاع، إن وجد"
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
                {editingSector ? "حفظ التعديلات" : "إضافة القطاع"}
              </button>
            </footer>
          </form>
        </div>
      )}

      {detailsSector && (
        <div
          className="entity-edit__overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailsSector(null);
          }}
        >
          <section
            aria-labelledby="sector-details-title"
            aria-modal="true"
            className="entity-edit__dialog max-h-[90vh] overflow-y-auto"
            role="dialog"
          >
            <header className="entity-edit__header">
              <div>
                <h2 id="sector-details-title" className="entity-edit__title">
                  تفاصيل القطاع
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {detailsSector.name}
                </p>
              </div>
              <button
                type="button"
                aria-label="إغلاق التفاصيل"
                className="entity-edit__close"
                onClick={() => setDetailsSector(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-[11px] text-slate-500">كود القطاع</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  {detailsSector.code}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-[11px] text-slate-500">اسم القطاع</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  {detailsSector.name}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-[11px] text-slate-500">
                  عدد المشروعات التابعة
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  {detailsSector.projectCount === null
                    ? "غير متاح"
                    : detailsSector.projectCount.toLocaleString("ar-EG")}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-[11px] text-slate-500">الحالة</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  {detailsSector.status}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
                <dt className="text-[11px] text-slate-500">وصف القطاع</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {detailsSector.description || "لا يوجد وصف"}
                </dd>
              </div>
            </dl>
            <footer className="entity-edit__actions">
              <button
                type="button"
                className="entity-edit__cancel"
                onClick={() => setDetailsSector(null)}
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
