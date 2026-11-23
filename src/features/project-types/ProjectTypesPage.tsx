"use client";

import { Plus } from "lucide-react";
import ProjectTypeFormDialog from "./components/ProjectTypeFormDialog";
import ProjectTypeTable from "./components/ProjectTypeTable";
import { useProjectTypes } from "./useProjectTypes";

export default function ProjectTypesPage() {
  const projectTypes = useProjectTypes();

  return (
    <main
      dir="rtl"
      className={`data-page${projectTypes.filteredProjectTypes.length ? " data-page--has-rows" : ""}`}
    >
      <header className="data-page__heading">
        <div>
          <h1 className="data-page__title">أنواع المشاريع</h1>
          <p className="mt-1 text-xs text-slate-500">
            إدارة أنواع المشاريع المستخدمة في منظومة المكتب الفني.
          </p>
        </div>
        <button
          type="button"
          onClick={projectTypes.openAddForm}
          className="data-page__add inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          <span>إضافة نوع مشروع</span>
        </button>
      </header>

      <ProjectTypeTable
        projectTypes={projectTypes.projectTypes}
        filteredProjectTypes={projectTypes.filteredProjectTypes}
        search={projectTypes.search}
        filters={projectTypes.filters}
        formError={projectTypes.formError}
        isFormOpen={projectTypes.isFormOpen}
        onSearchChange={projectTypes.setSearch}
        onFiltersChange={projectTypes.setFilters}
        onAdd={projectTypes.openAddForm}
        onEdit={projectTypes.openEditForm}
        onDelete={projectTypes.handleDelete}
      />

      {projectTypes.isFormOpen && (
        <ProjectTypeFormDialog
          editingProjectType={projectTypes.editingProjectType}
          form={projectTypes.form}
          formError={projectTypes.formError}
          onClose={projectTypes.resetForm}
          onSubmit={projectTypes.handleSave}
          onFieldChange={projectTypes.updateFormField}
        />
      )}
    </main>
  );
}
