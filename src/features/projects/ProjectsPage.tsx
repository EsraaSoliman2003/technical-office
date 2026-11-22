"use client";

import { Plus } from "lucide-react";
import ProjectDetailsDialog from "./components/ProjectDetailsDialog";
import ProjectFormDialog from "./components/ProjectFormDialog";
import ProjectTable from "./components/ProjectTable";
import { useProjects } from "./useProjects";

export default function ProjectsPage() {
  const projects = useProjects();

  return (
    <main
      dir="rtl"
      className={`data-page${projects.filteredProjects.length ? " data-page--has-rows" : ""}`}
    >
      <header className="data-page__heading">
        <div>
          <h1 className="data-page__title">المشاريع</h1>
          <p className="mt-1 text-xs text-slate-500">
            متابعة بيانات المشروعات ونسب التنفيذ وموقفها الحالي.
          </p>
        </div>
        <button
          type="button"
          onClick={projects.openAddForm}
          className="data-page__add inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          <span>إضافة مشروع</span>
        </button>
      </header>

      <ProjectTable
        projects={projects.projects}
        filteredProjects={projects.filteredProjects}
        search={projects.search}
        filters={projects.filters}
        formError={projects.formError}
        isFormOpen={projects.isFormOpen}
        onSearchChange={projects.setSearch}
        onFiltersChange={projects.setFilters}
        onAdd={projects.openAddForm}
        onView={projects.setDetailsProject}
        onEdit={projects.openEditForm}
        onDelete={projects.handleDelete}
      />

      {projects.isFormOpen && (
        <ProjectFormDialog
          editingProject={projects.editingProject}
          form={projects.form}
          formError={projects.formError}
          onClose={projects.resetForm}
          onSubmit={projects.handleSave}
          onFieldChange={projects.updateFormField}
          onImagesAdd={projects.addImagesToForm}
          onImagesChange={projects.updateFormImages}
        />
      )}

      {projects.detailsProject && (
        <ProjectDetailsDialog
          project={projects.detailsProject}
          onClose={() => projects.setDetailsProject(null)}
        />
      )}
    </main>
  );
}
