"use client";

import { Plus } from "lucide-react";
import MaterialFormDialog from "./components/MaterialFormDialog";
import MaterialTable from "./components/MaterialTable";
import { useMaterials } from "./useMaterials";

export default function MaterialsPage() {
  const materials = useMaterials();

  return (
    <main
      dir="rtl"
      className={`data-page${materials.filteredMaterials.length ? " data-page--has-rows" : ""}`}
    >
      <header className="data-page__heading">
        <div>
          <h1 className="data-page__title">الخامات</h1>
          <p className="mt-1 text-xs text-slate-500">
            إدارة بيانات الخامات المستخدمة في المشروعات.
          </p>
        </div>
        <button
          type="button"
          onClick={materials.openAddForm}
          className="data-page__add inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          <span>إضافة خامة</span>
        </button>
      </header>

      <MaterialTable
        materials={materials.materials}
        filteredMaterials={materials.filteredMaterials}
        search={materials.search}
        filters={materials.filters}
        formError={materials.formError}
        isFormOpen={materials.isFormOpen}
        onSearchChange={materials.setSearch}
        onFiltersChange={materials.setFilters}
        onAdd={materials.openAddForm}
        onEdit={materials.openEditForm}
        onDelete={materials.handleDelete}
      />

      {materials.isFormOpen && (
        <MaterialFormDialog
          editingMaterial={materials.editingMaterial}
          form={materials.form}
          formError={materials.formError}
          onClose={materials.resetForm}
          onSubmit={materials.handleSave}
          onFieldChange={materials.updateFormField}
        />
      )}
    </main>
  );
}
