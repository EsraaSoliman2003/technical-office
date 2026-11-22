"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { DataTableFilters } from "@/components/DataTable";
import { confirmDelete } from "@/utils/confirmDelete";
import { currentDataEntryUser, emptyProjectForm } from "./constants";
import type {
  Project,
  ProjectForm,
  ProjectFormField,
  ProjectImage,
} from "./types";

const getCurrentEditTime = () =>
  new Date().toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });

const getCurrentAddTime = () =>
  new Date().toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DataTableFilters<Project>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [detailsProject, setDetailsProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>({ ...emptyProjectForm });
  const [formError, setFormError] = useState("");

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");

    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        [
          project.name,
          project.allocation,
          project.projectStatus,
          project.iron,
          project.cement,
          project.marble,
          project.curbstones,
          project.executionPercentage,
          project.completionDate,
          project.editTime,
          project.lastEdit,
          project.addTime,
          project.enteredBy,
          ...project.materials.map((image) => image.name),
          ...project.offers.map((image) => image.name),
        ].some((value) => value.toLocaleLowerCase("ar").includes(query));
      const matchesFilters = (
        [
          "editTime",
          "lastEdit",
          "addTime",
          "enteredBy",
          "executionPercentage",
          "completionDate",
          "curbstones",
          "marble",
          "cement",
          "iron",
          "projectStatus",
          "allocation",
          "name",
        ] as const
      ).every((key) => {
        const selected = filters[key] ?? [];
        return selected.length === 0 || selected.includes(project[key]);
      });

      return matchesSearch && matchesFilters;
    });
  }, [filters, projects, search]);

  const resetForm = () => {
    setForm({ ...emptyProjectForm });
    setEditingProject(null);
    setFormError("");
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingProject(null);
    setForm({ ...emptyProjectForm });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (project: Project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      allocation: project.allocation,
      projectStatus: project.projectStatus,
      iron: project.iron,
      cement: project.cement,
      marble: project.marble,
      curbstones: project.curbstones,
      executionPercentage: project.executionPercentage,
      completionDate: project.completionDate,
      materials: [...project.materials],
      offers: [...project.offers],
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!event.currentTarget.reportValidity() || !form.name.trim()) {
      setFormError("يرجى إدخال اسم المشروع.");
      return;
    }

    const savedValues: ProjectForm = {
      name: form.name.trim(),
      allocation: form.allocation.trim(),
      projectStatus: form.projectStatus.trim(),
      iron: form.iron,
      cement: form.cement,
      marble: form.marble,
      curbstones: form.curbstones,
      executionPercentage: form.executionPercentage,
      completionDate: form.completionDate,
      materials: [...form.materials],
      offers: [...form.offers],
    };

    if (editingProject) {
      setProjects((current) =>
        current.map((project) =>
          project.id === editingProject.id
            ? {
                ...project,
                ...savedValues,
                editTime: getCurrentEditTime(),
                lastEdit: currentDataEntryUser,
              }
            : project,
        ),
      );
    } else {
      setProjects((current) => [
        {
          ...savedValues,
          id: Date.now(),
          editTime: "—",
          lastEdit: "—",
          addTime: getCurrentAddTime(),
          enteredBy: currentDataEntryUser,
        },
        ...current,
      ]);
    }

    resetForm();
  };

  const handleDelete = (project: Project) => {
    void confirmDelete(project.id, async (deleteId) => {
      setProjects((current) =>
        current.filter((item) => item.id !== Number(deleteId)),
      );
    });
  };

  const updateFormField = (field: ProjectFormField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError("");
  };

  const addImagesToForm = (
    field: "materials" | "offers",
    images: ProjectImage[],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: [...current[field], ...images],
    }));
  };

  const updateFormImages = (
    field: "materials" | "offers",
    images: ProjectImage[],
  ) => {
    setForm((current) => ({ ...current, [field]: images }));
  };

  return {
    projects,
    filteredProjects,
    search,
    setSearch,
    filters,
    setFilters,
    isFormOpen,
    editingProject,
    detailsProject,
    setDetailsProject,
    form,
    formError,
    resetForm,
    openAddForm,
    openEditForm,
    handleSave,
    handleDelete,
    updateFormField,
    addImagesToForm,
    updateFormImages,
  };
}
