"use client";

import { Plus } from "lucide-react";
import QuotationDetailsDialog from "./components/QuotationDetailsDialog";
import QuotationFormDialog from "./components/QuotationFormDialog";
import QuotationTable from "./components/QuotationTable";
import { useQuotations } from "./useQuotations";

export default function QuotationsPage() {
  const quotations = useQuotations();

  return (
    <main
      dir="rtl"
      className={`data-page${quotations.filteredQuotations.length ? " data-page--has-rows" : ""}`}
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
          onClick={quotations.openAddForm}
          className="data-page__add inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          <span>إضافة مقايسة جديدة</span>
        </button>
      </header>

      <QuotationTable
        quotations={quotations.quotations}
        filteredQuotations={quotations.filteredQuotations}
        search={quotations.search}
        filters={quotations.filters}
        onSearchChange={quotations.setSearch}
        onFiltersChange={quotations.setFilters}
        onAdd={quotations.openAddForm}
        onEdit={quotations.openEditForm}
        onDelete={quotations.handleDelete}
        onView={quotations.setDetailsQuotation}
      />

      {quotations.isFormOpen && (
        <QuotationFormDialog
          editingQuotation={quotations.editingQuotation}
          form={quotations.form}
          formError={quotations.formError}
          onClose={quotations.resetForm}
          onSubmit={quotations.handleSave}
          onFieldChange={quotations.updateFormField}
        />
      )}

      {quotations.detailsQuotation && (
        <QuotationDetailsDialog
          quotation={quotations.detailsQuotation}
          onClose={() => quotations.setDetailsQuotation(null)}
        />
      )}
    </main>
  );
}
