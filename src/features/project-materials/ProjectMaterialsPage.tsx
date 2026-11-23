"use client";

import { Plus } from "lucide-react";
import ProjectMaterialDetailsDialog from "./components/ProjectMaterialDetailsDialog";
import ProjectMaterialFormDialog from "./components/ProjectMaterialFormDialog";
import ProjectMaterialTable from "./components/ProjectMaterialTable";
import { useProjectMaterials } from "./useProjectMaterials";

export default function ProjectMaterialsPage() {
  const projectMaterials = useProjectMaterials();

  return (
    <main
      dir="rtl"
      className={`data-page${projectMaterials.filteredProjectMaterials.length ? " data-page--has-rows" : ""}`}
    >
      <header className="data-page__heading">
        <div>
          <h1 className="data-page__title">خامات المشاريع</h1>
          <p className="mt-1 text-xs text-slate-500">
            متابعة بيانات الخامات وأذون التحميل والبوليصات الخاصة بالمشروعات.
          </p>
        </div>
        <button
          type="button"
          onClick={projectMaterials.openAddForm}
          className="data-page__add inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          <span>إضافة خامة مشروع</span>
        </button>
      </header>

      <ProjectMaterialTable
        projectMaterials={projectMaterials.projectMaterials}
        filteredProjectMaterials={projectMaterials.filteredProjectMaterials}
        search={projectMaterials.search}
        filters={projectMaterials.filters}
        formError={projectMaterials.formError}
        isFormOpen={projectMaterials.isFormOpen}
        onSearchChange={projectMaterials.setSearch}
        onFiltersChange={projectMaterials.setFilters}
        onAdd={projectMaterials.openAddForm}
        onView={projectMaterials.setDetailsProjectMaterial}
        onEdit={projectMaterials.openEditForm}
        onDelete={projectMaterials.handleDelete}
      />

      {projectMaterials.isFormOpen && (
        <ProjectMaterialFormDialog
          editingProjectMaterial={projectMaterials.editingProjectMaterial}
          form={projectMaterials.form}
          formError={projectMaterials.formError}
          onClose={projectMaterials.resetForm}
          onSubmit={projectMaterials.handleSave}
          onFieldChange={projectMaterials.updateFormField}
          onBillAttachmentChange={projectMaterials.updateBillAttachment}
        />
      )}

      {projectMaterials.detailsProjectMaterial && (
        <ProjectMaterialDetailsDialog
          projectMaterial={projectMaterials.detailsProjectMaterial}
          onClose={() => projectMaterials.setDetailsProjectMaterial(null)}
        />
      )}
    </main>
  );
}
