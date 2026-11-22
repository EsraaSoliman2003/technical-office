"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { DataTableFilters } from "@/components/DataTable";
import { confirmDelete } from "@/utils/confirmDelete";
import { emptyCompanyMaterialForm } from "./constants";
import type {
  CompanyMaterial,
  CompanyMaterialForm,
  CompanyMaterialFormField,
} from "./types";
import type { UploadedFile } from "@/types/UploadedFile";

const currentDataEntryUser = "إسراء سليمان";

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

export function useCompanyMaterials() {
  const [companyMaterials, setCompanyMaterials] = useState<CompanyMaterial[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const [filters, setFilters] =
    useState<DataTableFilters<CompanyMaterial>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompanyMaterial, setEditingCompanyMaterial] =
    useState<CompanyMaterial | null>(null);
  const [detailsCompanyMaterial, setDetailsCompanyMaterial] =
    useState<CompanyMaterial | null>(null);
  const [form, setForm] = useState<CompanyMaterialForm>({
    ...emptyCompanyMaterialForm,
  });
  const [formError, setFormError] = useState("");

  const filteredCompanyMaterials = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");

    return companyMaterials.filter((companyMaterial) => {
      const matchesSearch =
        !query ||
        [
          companyMaterial.notes,
          companyMaterial.receivingEngineer,
          companyMaterial.quantity,
          companyMaterial.executingCompany,
          companyMaterial.material,
          companyMaterial.projectName,
          companyMaterial.loadingPermitNumber,
          companyMaterial.billOfLading?.name ?? "",
          companyMaterial.editTime,
          companyMaterial.lastEdit,
          companyMaterial.addTime,
        ].some((value) => value.toLocaleLowerCase("ar").includes(query));
      const matchesFilters = (
        [
          "editTime",
          "lastEdit",
          "addTime",
          "notes",
          "receivingEngineer",
          "quantity",
          "executingCompany",
          "material",
          "projectName",
          "loadingPermitNumber",
        ] as const
      ).every((key) => {
        const selected = filters[key] ?? [];
        return (
          selected.length === 0 || selected.includes(companyMaterial[key])
        );
      });

      return matchesSearch && matchesFilters;
    });
  }, [companyMaterials, filters, search]);

  const resetForm = () => {
    setForm({ ...emptyCompanyMaterialForm });
    setEditingCompanyMaterial(null);
    setFormError("");
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingCompanyMaterial(null);
    setForm({ ...emptyCompanyMaterialForm });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (companyMaterial: CompanyMaterial) => {
    setEditingCompanyMaterial(companyMaterial);
    setForm({
      notes: companyMaterial.notes,
      receivingEngineer: companyMaterial.receivingEngineer,
      quantity: companyMaterial.quantity,
      executingCompany: companyMaterial.executingCompany,
      material: companyMaterial.material,
      projectName: companyMaterial.projectName,
      loadingPermitNumber: companyMaterial.loadingPermitNumber,
      billOfLading: companyMaterial.billOfLading,
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const hasMissingRequiredField = [
      form.receivingEngineer,
      form.executingCompany,
      form.material,
      form.projectName,
      form.loadingPermitNumber,
    ].some((value) => !value.trim());

    if (
      !event.currentTarget.reportValidity() ||
      hasMissingRequiredField ||
      !form.quantity
    ) {
      setFormError("يرجى استكمال الحقول المطلوبة.");
      return;
    }

    const savedValues: CompanyMaterialForm = {
      notes: form.notes.trim(),
      receivingEngineer: form.receivingEngineer.trim(),
      quantity: form.quantity,
      executingCompany: form.executingCompany.trim(),
      material: form.material.trim(),
      projectName: form.projectName.trim(),
      loadingPermitNumber: form.loadingPermitNumber.trim(),
      billOfLading: form.billOfLading,
    };

    if (editingCompanyMaterial) {
      setCompanyMaterials((current) =>
        current.map((companyMaterial) =>
          companyMaterial.id === editingCompanyMaterial.id
            ? {
                ...companyMaterial,
                ...savedValues,
                editTime: getCurrentEditTime(),
                lastEdit: currentDataEntryUser,
              }
            : companyMaterial,
        ),
      );
    } else {
      setCompanyMaterials((current) => [
        {
          ...savedValues,
          id: Date.now(),
          editTime: "—",
          lastEdit: "—",
          addTime: getCurrentAddTime(),
        },
        ...current,
      ]);
    }

    resetForm();
  };

  const handleDelete = (companyMaterial: CompanyMaterial) => {
    void confirmDelete(companyMaterial.id, async (deleteId) => {
      setCompanyMaterials((current) =>
        current.filter((item) => item.id !== Number(deleteId)),
      );
    });
  };

  const updateFormField = (
    field: CompanyMaterialFormField,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError("");
  };

  const updateBillOfLading = (billOfLading: UploadedFile | null) => {
    setForm((current) => ({ ...current, billOfLading }));
  };

  return {
    companyMaterials,
    filteredCompanyMaterials,
    search,
    setSearch,
    filters,
    setFilters,
    isFormOpen,
    editingCompanyMaterial,
    detailsCompanyMaterial,
    setDetailsCompanyMaterial,
    form,
    formError,
    resetForm,
    openAddForm,
    openEditForm,
    handleSave,
    handleDelete,
    updateFormField,
    updateBillOfLading,
  };
}
