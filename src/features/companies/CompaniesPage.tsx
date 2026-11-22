"use client";

import { Plus } from "lucide-react";
import CompanyDetailsDialog from "./components/CompanyDetailsDialog";
import CompanyFormDialog from "./components/CompanyFormDialog";
import CompanyTable from "./components/CompanyTable";
import { useCompanies } from "./useCompanies";

export default function CompaniesPage() {
  const companies = useCompanies();

  return (
    <main
      dir="rtl"
      className={`data-page${companies.filteredCompanies.length ? " data-page--has-rows" : ""}`}
    >
      <header className="data-page__heading">
        <div>
          <h1 className="data-page__title">الشركات</h1>
          <p className="mt-1 text-xs text-slate-500">
            إدارة بيانات الشركات ومتابعة بيانات التواصل والسجل التجاري.
          </p>
        </div>
        <button
          type="button"
          onClick={companies.openAddForm}
          className="data-page__add inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          <span>إضافة شركة</span>
        </button>
      </header>

      <CompanyTable
        companies={companies.companies}
        filteredCompanies={companies.filteredCompanies}
        search={companies.search}
        filters={companies.filters}
        formError={companies.formError}
        isFormOpen={companies.isFormOpen}
        onSearchChange={companies.setSearch}
        onFiltersChange={companies.setFilters}
        onAdd={companies.openAddForm}
        onView={companies.setDetailsCompany}
        onEdit={companies.openEditForm}
        onDelete={companies.handleDelete}
      />

      {companies.isFormOpen && (
        <CompanyFormDialog
          editingCompany={companies.editingCompany}
          form={companies.form}
          formError={companies.formError}
          onClose={companies.resetForm}
          onSubmit={companies.handleSave}
          onFieldChange={companies.updateFormField}
          onAttachmentsAdd={companies.addAttachmentsToForm}
          onAttachmentsChange={companies.updateFormAttachments}
        />
      )}

      {companies.detailsCompany && (
        <CompanyDetailsDialog
          company={companies.detailsCompany}
          onClose={() => companies.setDetailsCompany(null)}
        />
      )}
    </main>
  );
}
