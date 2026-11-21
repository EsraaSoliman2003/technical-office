"use client";

import { ArrowDown, ArrowUpDown, Building2, FileSpreadsheet, Filter, Printer, Search } from "lucide-react";

export default function Page() {
  const columns = ["اسم الشركة", "الكود", "الهاتف", "البريد الإلكتروني", "الحالة"];

  return (
    <main dir="rtl" className="data-page">
      <header className="data-page__heading"><h1 className="data-page__title">الشركات</h1><p className="data-page__breadcrumb">Dashboard / الشركات</p></header>
      <div className="data-page__actions"><button type="button" onClick={() => window.print()} className="data-page__action"><Printer size={13} />طباعة الجدول</button><button type="button" disabled className="data-page__action"><FileSpreadsheet size={13} />تصدير إكسيل</button></div>
      <section className="data-page__card">
        <div className="data-page__toolbar"><button type="button" className="data-page__add">إضافة شركة</button><label className="data-page__search"><input type="search" placeholder="بحث في الشركات..." aria-label="بحث في الشركات" /><Search size={14} /></label></div>
        <div className="data-page__table-scroll"><table className="data-page__table"><thead><tr><th className="data-page__select-column"><Filter size={12} /></th>{columns.map((column) => <th key={column}><span className="data-page__column-label">{column}<ArrowUpDown size={10} /><Filter size={10} /></span></th>)}</tr></thead><tbody><tr><td colSpan={columns.length + 1} className="data-page__empty-cell"><div className="data-page__empty"><span className="data-page__empty-icon"><Building2 size={22} /></span><p className="data-page__empty-message">لا توجد شركات مضافة حتى الآن</p></div></td></tr></tbody></table></div>
        <footer className="data-page__footer"><span>عدد الشركات: 0</span><span className="data-page__result-status"><ArrowDown size={12} />لا توجد نتائج</span></footer>
      </section>
    </main>
  );
}
