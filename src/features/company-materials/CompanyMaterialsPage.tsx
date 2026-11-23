"use client";

import { Plus } from "lucide-react";
import CompanyMaterialDetailsDialog from "./components/CompanyMaterialDetailsDialog";
import CompanyMaterialFormDialog from "./components/CompanyMaterialFormDialog";
import CompanyMaterialTable from "./components/CompanyMaterialTable";
import { useCompanyMaterials } from "./useCompanyMaterials";

export default function CompanyMaterialsPage() {
  const companyMaterials = useCompanyMaterials();

  return (
    <main
      dir="rtl"
      className={`data-page${companyMaterials.filteredCompanyMaterials.length ? " data-page--has-rows" : ""}`}
    >
      <header className="data-page__heading">
        <div>
          <h1 className="data-page__title">خامات الشركات</h1>
          <p className="mt-1 text-xs text-slate-500">
            متابعة الخامات المستلمة للشركات وأذون التحميل والبوليصات.
          </p>
        </div>
        <button
          type="button"
          onClick={companyMaterials.openAddForm}
          className="data-page__add inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          <span>إضافة خامة شركة</span>
        </button>
      </header>

      <CompanyMaterialTable
        companyMaterials={companyMaterials.companyMaterials}
        filteredCompanyMaterials={companyMaterials.filteredCompanyMaterials}
        search={companyMaterials.search}
        filters={companyMaterials.filters}
        formError={companyMaterials.formError}
        isFormOpen={companyMaterials.isFormOpen}
        onSearchChange={companyMaterials.setSearch}
        onFiltersChange={companyMaterials.setFilters}
        onAdd={companyMaterials.openAddForm}
        onView={companyMaterials.setDetailsCompanyMaterial}
        onEdit={companyMaterials.openEditForm}
        onDelete={companyMaterials.handleDelete}
      />

      {companyMaterials.isFormOpen && (
        <CompanyMaterialFormDialog
          editingCompanyMaterial={companyMaterials.editingCompanyMaterial}
          form={companyMaterials.form}
          formError={companyMaterials.formError}
          onClose={companyMaterials.resetForm}
          onSubmit={companyMaterials.handleSave}
          onFieldChange={companyMaterials.updateFormField}
          onBillOfLadingChange={companyMaterials.updateBillOfLading}
        />
      )}

      {companyMaterials.detailsCompanyMaterial && (
        <CompanyMaterialDetailsDialog
          companyMaterial={companyMaterials.detailsCompanyMaterial}
          onClose={() => companyMaterials.setDetailsCompanyMaterial(null)}
        />
      )}
    </main>
  );
}
