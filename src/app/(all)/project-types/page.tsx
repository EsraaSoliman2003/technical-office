
"use client";

import {
  ArrowDown,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  Search,
} from "lucide-react";

export default function Page() {
  const columns = ["اسم النوع", "الكود", "الوصف", "الحالة"];

  return (
    <main dir="rtl" className="data-page">
      <header className="data-page__heading">
        <div>
          <h1 className="data-page__title">انواع المشاريع</h1>

          <p className="data-page__breadcrumb">
            Dashboard / انواع المشاريع
          </p>
        </div>

        <button
          type="button"
          className="data-page__add"
        >
          <span>إضافة نوع مشروع</span>
        </button>
      </header>

      <section className="data-page__card">
        <div className="data-page__toolbar">
          <label className="data-page__search">
            <input
              type="search"
              placeholder="بحث في انواع المشاريع..."
              aria-label="بحث في انواع المشاريع"
            />
            <Search size={15} />
          </label>

          <div className="data-page__actions">
            <button
              type="button"
              onClick={() => window.print()}
              className="data-page__action"
            >
              <Printer size={15} />
              <span>طباعة الجدول</span>
            </button>

            <button
              type="button"
              disabled
              className="data-page__action"
            >
              <FileSpreadsheet size={15} />
              <span>تصدير إكسيل</span>
            </button>
          </div>
        </div>

        <div className="data-page__table-scroll">
          <table className="data-page__table">
            <thead>
              <tr>
                <th className="data-page__select-column">
                  <Filter size={13} />
                </th>

                {columns.map((column) => (
                  <th key={column}>
                    <span className="data-page__column-label">
                      {column}
                      <ArrowUpDown size={11} />
                      <Filter size={11} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="data-page__empty-cell"
                >
                  <div className="data-page__empty">
                    <span className="data-page__empty-icon">
                      <FileText size={24} />
                    </span>

                    <p className="data-page__empty-message">
                      لا توجد أنواع مشاريع مضافة حتى الآن
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer className="data-page__footer">
          <span>عدد انواع المشاريع: 0</span>

          <span className="data-page__result-status">
            <ArrowDown size={13} />
            لا توجد نتائج
          </span>
        </footer>
      </section>
    </main>
  );
}
