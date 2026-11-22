"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { DataTableFilters } from "@/components/DataTable";
import { confirmDelete } from "@/utils/confirmDelete";
import {
  currentDataEntryUser,
  emptyProjectTypeForm,
} from "./constants";
import type { ProjectType, ProjectTypeForm } from "./types";

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

export function useProjectTypes() {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DataTableFilters<ProjectType>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProjectType, setEditingProjectType] =
    useState<ProjectType | null>(null);
  const [form, setForm] = useState<ProjectTypeForm>({
    ...emptyProjectTypeForm,
  });
  const [formError, setFormError] = useState("");

  const filteredProjectTypes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");

    return projectTypes.filter((projectType) => {
      const matchesSearch =
        !query ||
        Object.values(projectType).some((value) =>
          String(value).toLocaleLowerCase("ar").includes(query),
        );
      const matchesFilters = (
        ["editTime", "lastEdit", "addTime", "enteredBy", "name"] as const
      ).every((key) => {
        const selected = filters[key] ?? [];
        return (
          selected.length === 0 || selected.includes(projectType[key])
        );
      });

      return matchesSearch && matchesFilters;
    });
  }, [filters, projectTypes, search]);

  const resetForm = () => {
    setForm({ ...emptyProjectTypeForm });
    setEditingProjectType(null);
    setFormError("");
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingProjectType(null);
    setForm({ ...emptyProjectTypeForm });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (projectType: ProjectType) => {
    setEditingProjectType(projectType);
    setForm({ name: projectType.name });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!event.currentTarget.reportValidity() || !form.name.trim()) {
      setFormError("يرجى إدخال نوع المشروع.");
      return;
    }

    const normalizedName = form.name.trim().toLocaleLowerCase("ar");
    const duplicateProjectType = projectTypes.some(
      (projectType) =>
        projectType.id !== editingProjectType?.id &&
        projectType.name.trim().toLocaleLowerCase("ar") === normalizedName,
    );

    if (duplicateProjectType) {
      setFormError("نوع المشروع موجود بالفعل.");
      return;
    }

    const savedValues: ProjectTypeForm = {
      name: form.name.trim(),
    };

    if (editingProjectType) {
      setProjectTypes((current) =>
        current.map((projectType) =>
          projectType.id === editingProjectType.id
            ? {
                ...projectType,
                ...savedValues,
                editTime: getCurrentEditTime(),
                lastEdit: currentDataEntryUser,
              }
            : projectType,
        ),
      );
    } else {
      setProjectTypes((current) => [
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

  const handleDelete = (projectType: ProjectType) => {
    void confirmDelete(projectType.id, async (deleteId) => {
      setProjectTypes((current) =>
        current.filter((item) => item.id !== Number(deleteId)),
      );
    });
  };

  const updateFormField = (field: keyof ProjectTypeForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError("");
  };

  return {
    projectTypes,
    filteredProjectTypes,
    search,
    setSearch,
    filters,
    setFilters,
    isFormOpen,
    editingProjectType,
    form,
    formError,
    resetForm,
    openAddForm,
    openEditForm,
    handleSave,
    handleDelete,
    updateFormField,
  };
}
