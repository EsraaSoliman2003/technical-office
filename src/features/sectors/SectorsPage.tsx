"use client";

import { Plus } from "lucide-react";
import SectorFormDialog from "./components/SectorFormDialog";
import SectorTable from "./components/SectorTable";
import { useSectors } from "./useSectors";

export default function SectorsPage() {
  const sectors = useSectors();

  return (
    <main
      dir="rtl"
      className={`data-page${sectors.filteredSectors.length ? " data-page--has-rows" : ""}`}
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
          onClick={sectors.openAddForm}
          className="data-page__add inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          <span>إضافة قطاع جديد</span>
        </button>
      </header>

      <SectorTable
        sectors={sectors.sectors}
        filteredSectors={sectors.filteredSectors}
        search={sectors.search}
        filters={sectors.filters}
        formError={sectors.formError}
        isFormOpen={sectors.isFormOpen}
        onSearchChange={sectors.setSearch}
        onFiltersChange={sectors.setFilters}
        onAdd={sectors.openAddForm}
        onEdit={sectors.openEditForm}
        onDelete={sectors.handleDelete}
      />

      {sectors.isFormOpen && (
        <SectorFormDialog
          editingSector={sectors.editingSector}
          form={sectors.form}
          formError={sectors.formError}
          onClose={sectors.resetForm}
          onSubmit={sectors.handleSave}
          onFieldChange={sectors.updateFormField}
        />
      )}

    </main>
  );
}
