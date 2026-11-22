"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { DataTableFilters } from "@/components/DataTable";
import { confirmDelete } from "@/utils/confirmDelete";
import { currentDataEntryUser, emptySectorForm } from "./constants";
import type { Sector, SectorForm } from "./types";

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

export function useSectors() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DataTableFilters<Sector>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [form, setForm] = useState<SectorForm>({ ...emptySectorForm });
  const [formError, setFormError] = useState("");

  const filteredSectors = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");

    return sectors.filter((sector) => {
      const matchesSearch =
        !query ||
        Object.values(sector).some((value) =>
          String(value).toLocaleLowerCase("ar").includes(query),
        );
      const matchesFilters = (
        ["editTime", "lastEdit", "addTime", "enteredBy", "name"] as const
      ).every((key) => {
        const selected = filters[key] ?? [];
        return selected.length === 0 || selected.includes(sector[key]);
      });

      return matchesSearch && matchesFilters;
    });
  }, [filters, search, sectors]);

  const resetForm = () => {
    setForm({ ...emptySectorForm });
    setEditingSector(null);
    setFormError("");
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingSector(null);
    setForm({ ...emptySectorForm });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (sector: Sector) => {
    setEditingSector(sector);
    setForm({ name: sector.name });
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

    const normalizedName = form.name.trim().toLocaleLowerCase("ar");
    const duplicateSector = sectors.some(
      (sector) =>
        sector.id !== editingSector?.id &&
        sector.name.trim().toLocaleLowerCase("ar") === normalizedName,
    );

    if (duplicateSector) {
      setFormError("اسم القطاع مستخدم بالفعل.");
      return;
    }

    const savedValues = {
      name: form.name.trim(),
    };

    if (editingSector) {
      setSectors((current) =>
        current.map((sector) =>
          sector.id === editingSector.id
            ? {
                ...sector,
                ...savedValues,
                editTime: getCurrentEditTime(),
                lastEdit: currentDataEntryUser,
              }
            : sector,
        ),
      );
    } else {
      setSectors((current) => [
        {
          ...savedValues,
          id: Date.now(),
          projectCount: null,
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

  const handleDelete = (sector: Sector) => {
    if (sector.projectCount === null) {
      setFormError(
        "تعذر التحقق من ارتباط القطاع بالمشروعات؛ الحذف غير متاح حاليًا.",
      );
      return;
    }

    if (sector.projectCount > 0) {
      setFormError("لا يمكن حذف قطاع مرتبط بمشروعات.");
      return;
    }

    void confirmDelete(sector.id, async (deleteId) => {
      setSectors((current) =>
        current.filter((item) => item.id !== Number(deleteId)),
      );
    });
  };

  const updateFormField = (field: keyof SectorForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    if (formError) setFormError("");
  };

  return {
    sectors,
    filteredSectors,
    search,
    setSearch,
    filters,
    setFilters,
    isFormOpen,
    editingSector,
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
