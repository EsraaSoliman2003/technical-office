"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { DataTableFilters } from "@/components/DataTable";
import { confirmDelete } from "@/utils/confirmDelete";
import { emptyQuotationForm } from "./constants";
import type { Quotation, QuotationForm } from "./types";

export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DataTableFilters<Quotation>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(
    null,
  );
  const [detailsQuotation, setDetailsQuotation] = useState<Quotation | null>(
    null,
  );
  const [form, setForm] = useState<QuotationForm>({ ...emptyQuotationForm });
  const [formError, setFormError] = useState("");

  const filteredQuotations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");

    return quotations.filter((quotation) => {
      const matchesSearch =
        !query ||
        Object.values(quotation).some((value) =>
          String(value).toLocaleLowerCase("ar").includes(query),
        );
      const matchesFilters = (
        ["project", "company", "stage", "status"] as const
      ).every((key) => {
        const selected = filters[key] ?? [];
        return selected.length === 0 || selected.includes(quotation[key]);
      });

      return matchesSearch && matchesFilters;
    });
  }, [filters, quotations, search]);

  const resetForm = () => {
    setForm({ ...emptyQuotationForm });
    setEditingQuotation(null);
    setFormError("");
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingQuotation(null);
    setForm({ ...emptyQuotationForm });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setForm({
      number: quotation.number,
      project: quotation.project,
      company: quotation.company,
      description: quotation.description,
      administrationValue: quotation.administrationValue,
      consultantValue: quotation.consultantValue,
      stage: quotation.stage,
      owner: quotation.owner,
      status: quotation.status,
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!event.currentTarget.reportValidity()) {
      setFormError("يرجى استكمال الحقول المطلوبة والتحقق من القيم المدخلة.");
      return;
    }

    const savedValues: QuotationForm = {
      number: form.number.trim(),
      project: form.project.trim(),
      company: form.company.trim(),
      description: form.description.trim(),
      administrationValue: form.administrationValue,
      consultantValue: form.consultantValue,
      stage: form.stage,
      owner: form.owner.trim(),
      status: form.status,
    };

    if (editingQuotation) {
      setQuotations((current) =>
        current.map((quotation) =>
          quotation.id === editingQuotation.id
            ? { ...savedValues, id: quotation.id }
            : quotation,
        ),
      );
    } else {
      setQuotations((current) => [
        { ...savedValues, id: Date.now() },
        ...current,
      ]);
    }

    resetForm();
  };

  const handleDelete = (quotation: Quotation) => {
    void confirmDelete(quotation.id, async (deleteId) => {
      setQuotations((current) =>
        current.filter((item) => item.id !== Number(deleteId)),
      );
    });
  };

  const updateFormField = (field: keyof QuotationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError("");
  };

  return {
    quotations,
    filteredQuotations,
    search,
    setSearch,
    filters,
    setFilters,
    isFormOpen,
    editingQuotation,
    detailsQuotation,
    setDetailsQuotation,
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
