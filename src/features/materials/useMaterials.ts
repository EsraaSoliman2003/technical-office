"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { DataTableFilters } from "@/components/DataTable";
import { confirmDelete } from "@/utils/confirmDelete";
import { currentDataEntryUser, emptyMaterialForm } from "./constants";
import type { Material, MaterialForm } from "./types";

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

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DataTableFilters<Material>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(
    null,
  );
  const [form, setForm] = useState<MaterialForm>({ ...emptyMaterialForm });
  const [formError, setFormError] = useState("");

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");

    return materials.filter((material) => {
      const matchesSearch =
        !query ||
        Object.values(material).some((value) =>
          String(value).toLocaleLowerCase("ar").includes(query),
        );
      const matchesFilters = (
        ["editTime", "lastEdit", "addTime", "enteredBy", "name"] as const
      ).every((key) => {
        const selected = filters[key] ?? [];
        return selected.length === 0 || selected.includes(material[key]);
      });

      return matchesSearch && matchesFilters;
    });
  }, [filters, materials, search]);

  const resetForm = () => {
    setForm({ ...emptyMaterialForm });
    setEditingMaterial(null);
    setFormError("");
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingMaterial(null);
    setForm({ ...emptyMaterialForm });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (material: Material) => {
    setEditingMaterial(material);
    setForm({ name: material.name });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!event.currentTarget.reportValidity() || !form.name.trim()) {
      setFormError("يرجى إدخال اسم الخامة.");
      return;
    }

    const savedValues: MaterialForm = {
      name: form.name.trim(),
    };

    if (editingMaterial) {
      setMaterials((current) =>
        current.map((material) =>
          material.id === editingMaterial.id
            ? {
                ...material,
                ...savedValues,
                editTime: getCurrentEditTime(),
                lastEdit: currentDataEntryUser,
              }
            : material,
        ),
      );
    } else {
      setMaterials((current) => [
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

  const handleDelete = (material: Material) => {
    void confirmDelete(material.id, async (deleteId) => {
      setMaterials((current) =>
        current.filter((item) => item.id !== Number(deleteId)),
      );
    });
  };

  const updateFormField = (field: keyof MaterialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError("");
  };

  return {
    materials,
    filteredMaterials,
    search,
    setSearch,
    filters,
    setFilters,
    isFormOpen,
    editingMaterial,
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
