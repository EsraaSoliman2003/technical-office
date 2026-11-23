"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { DataTableFilters } from "@/components/DataTable";
import { confirmDelete } from "@/utils/confirmDelete";
import {
  currentDataEntryUser,
  emptyProjectMaterialForm,
} from "./constants";
import type {
  ProjectMaterial,
  ProjectMaterialForm,
  ProjectMaterialFormField,
} from "./types";
import type { UploadedFile } from "@/types/UploadedFile";

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

export function useProjectMaterials() {
  const [projectMaterials, setProjectMaterials] = useState<ProjectMaterial[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const [filters, setFilters] =
    useState<DataTableFilters<ProjectMaterial>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProjectMaterial, setEditingProjectMaterial] =
    useState<ProjectMaterial | null>(null);
  const [detailsProjectMaterial, setDetailsProjectMaterial] =
    useState<ProjectMaterial | null>(null);
  const [form, setForm] = useState<ProjectMaterialForm>({
    ...emptyProjectMaterialForm,
  });
  const [formError, setFormError] = useState("");

  const filteredProjectMaterials = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");

    return projectMaterials.filter((projectMaterial) => {
      const matchesSearch =
        !query ||
        [
          projectMaterial.notes,
          projectMaterial.quantity,
          projectMaterial.material,
          projectMaterial.projectName,
          projectMaterial.billOfLadingNumber,
          projectMaterial.authorizationNumber,
          projectMaterial.projectType,
          projectMaterial.billAttachment?.name ?? "",
          projectMaterial.loadingPermitNumber,
          projectMaterial.salesOrderNumber,
          projectMaterial.vehicleNumber,
          projectMaterial.driverName,
          projectMaterial.factory,
          projectMaterial.mixer,
          projectMaterial.transportCompany,
          projectMaterial.billDate,
          projectMaterial.receivedDate,
          projectMaterial.exitDate,
          projectMaterial.editTime,
          projectMaterial.lastEdit,
          projectMaterial.addTime,
        ].some((value) => value.toLocaleLowerCase("ar").includes(query));
      const matchesFilters = (
        [
          "editTime",
          "lastEdit",
          "addTime",
          "notes",
          "quantity",
          "material",
          "projectName",
          "billOfLadingNumber",
          "authorizationNumber",
        ] as const
      ).every((key) => {
        const selected = filters[key] ?? [];
        return (
          selected.length === 0 || selected.includes(projectMaterial[key])
        );
      });

      return matchesSearch && matchesFilters;
    });
  }, [filters, projectMaterials, search]);

  const resetForm = () => {
    setForm({ ...emptyProjectMaterialForm });
    setEditingProjectMaterial(null);
    setFormError("");
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingProjectMaterial(null);
    setForm({ ...emptyProjectMaterialForm });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (projectMaterial: ProjectMaterial) => {
    setEditingProjectMaterial(projectMaterial);
    setForm({
      authorizationNumber: projectMaterial.authorizationNumber,
      projectType: projectMaterial.projectType,
      projectName: projectMaterial.projectName,
      billOfLadingNumber: projectMaterial.billOfLadingNumber,
      billDate: projectMaterial.billDate,
      quantity: projectMaterial.quantity,
      material: projectMaterial.material,
      loadingPermitNumber: projectMaterial.loadingPermitNumber,
      salesOrderNumber: projectMaterial.salesOrderNumber,
      vehicleNumber: projectMaterial.vehicleNumber,
      driverName: projectMaterial.driverName,
      factory: projectMaterial.factory,
      mixer: projectMaterial.mixer,
      transportCompany: projectMaterial.transportCompany,
      receivedDate: projectMaterial.receivedDate,
      exitDate: projectMaterial.exitDate,
      notes: projectMaterial.notes,
      billAttachment: projectMaterial.billAttachment,
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!event.currentTarget.reportValidity()) {
      setFormError("يرجى استكمال الحقول المطلوبة.");
      return;
    }

    const requiredFields = [
      form.authorizationNumber,
      form.projectType,
      form.projectName,
      form.billOfLadingNumber,
      form.billDate,
      form.quantity,
      form.material,
      form.loadingPermitNumber,
      form.salesOrderNumber,
      form.vehicleNumber,
      form.driverName,
      form.factory,
      form.mixer,
      form.transportCompany,
      form.receivedDate,
      form.exitDate,
    ];

    if (requiredFields.some((value) => !value.trim())) {
      setFormError("يرجى استكمال الحقول المطلوبة.");
      return;
    }

    const savedValues: ProjectMaterialForm = {
      authorizationNumber: form.authorizationNumber.trim(),
      projectType: form.projectType,
      projectName: form.projectName,
      billOfLadingNumber: form.billOfLadingNumber.trim(),
      billDate: form.billDate,
      quantity: form.quantity,
      material: form.material,
      loadingPermitNumber: form.loadingPermitNumber.trim(),
      salesOrderNumber: form.salesOrderNumber.trim(),
      vehicleNumber: form.vehicleNumber.trim(),
      driverName: form.driverName.trim(),
      factory: form.factory,
      mixer: form.mixer,
      transportCompany: form.transportCompany,
      receivedDate: form.receivedDate,
      exitDate: form.exitDate,
      notes: form.notes.trim(),
      billAttachment: form.billAttachment,
    };

    if (editingProjectMaterial) {
      setProjectMaterials((current) =>
        current.map((projectMaterial) =>
          projectMaterial.id === editingProjectMaterial.id
            ? {
                ...projectMaterial,
                ...savedValues,
                editTime: getCurrentEditTime(),
                lastEdit: currentDataEntryUser,
              }
            : projectMaterial,
        ),
      );
    } else {
      setProjectMaterials((current) => [
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

  const handleDelete = (projectMaterial: ProjectMaterial) => {
    void confirmDelete(projectMaterial.id, async (deleteId) => {
      setProjectMaterials((current) =>
        current.filter((item) => item.id !== Number(deleteId)),
      );
    });
  };

  const updateFormField = (
    field: ProjectMaterialFormField,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError("");
  };

  const updateBillAttachment = (billAttachment: UploadedFile | null) => {
    setForm((current) => ({ ...current, billAttachment }));
  };

  return {
    projectMaterials,
    filteredProjectMaterials,
    search,
    setSearch,
    filters,
    setFilters,
    isFormOpen,
    editingProjectMaterial,
    detailsProjectMaterial,
    setDetailsProjectMaterial,
    form,
    formError,
    resetForm,
    openAddForm,
    openEditForm,
    handleSave,
    handleDelete,
    updateFormField,
    updateBillAttachment,
  };
}
