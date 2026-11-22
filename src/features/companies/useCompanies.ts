"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { DataTableFilters } from "@/components/DataTable";
import { confirmDelete } from "@/utils/confirmDelete";
import { currentDataEntryUser, emptyCompanyForm } from "./constants";
import type {
  Company,
  CompanyForm,
  CompanyFormField,
} from "./types";
import type { UploadedImage } from "@/types/UploadedImage";

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

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DataTableFilters<Company>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [detailsCompany, setDetailsCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyForm>({ ...emptyCompanyForm });
  const [formError, setFormError] = useState("");

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");

    return companies.filter((company) => {
      const matchesSearch =
        !query ||
        [
          company.name,
          company.mobile,
          company.commercialRegister,
          company.editTime,
          company.lastEdit,
          company.addTime,
          company.enteredBy,
          ...company.attachments.map((attachment) => attachment.name),
        ].some((value) => value.toLocaleLowerCase("ar").includes(query));
      const matchesFilters = (
        [
          "editTime",
          "lastEdit",
          "addTime",
          "enteredBy",
          "mobile",
          "commercialRegister",
          "name",
        ] as const
      ).every((key) => {
        const selected = filters[key] ?? [];
        return selected.length === 0 || selected.includes(company[key]);
      });

      return matchesSearch && matchesFilters;
    });
  }, [companies, filters, search]);

  const resetForm = () => {
    setForm({ ...emptyCompanyForm });
    setEditingCompany(null);
    setFormError("");
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingCompany(null);
    setForm({ ...emptyCompanyForm });
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (company: Company) => {
    setEditingCompany(company);
    setForm({
      name: company.name,
      mobile: company.mobile,
      commercialRegister: company.commercialRegister,
      attachments: [...company.attachments],
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!event.currentTarget.reportValidity() || !form.name.trim()) {
      setFormError("يرجى إدخال اسم الشركة.");
      return;
    }

    const savedValues: CompanyForm = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      commercialRegister: form.commercialRegister.trim(),
      attachments: [...form.attachments],
    };

    if (editingCompany) {
      setCompanies((current) =>
        current.map((company) =>
          company.id === editingCompany.id
            ? {
                ...company,
                ...savedValues,
                editTime: getCurrentEditTime(),
                lastEdit: currentDataEntryUser,
              }
            : company,
        ),
      );
    } else {
      setCompanies((current) => [
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

  const handleDelete = (company: Company) => {
    void confirmDelete(company.id, async (deleteId) => {
      setCompanies((current) =>
        current.filter((item) => item.id !== Number(deleteId)),
      );
    });
  };

  const updateFormField = (field: CompanyFormField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError("");
  };

  const addAttachmentsToForm = (attachments: UploadedImage[]) => {
    setForm((current) => ({
      ...current,
      attachments: [...current.attachments, ...attachments],
    }));
  };

  const updateFormAttachments = (attachments: UploadedImage[]) => {
    setForm((current) => ({ ...current, attachments }));
  };

  return {
    companies,
    filteredCompanies,
    search,
    setSearch,
    filters,
    setFilters,
    isFormOpen,
    editingCompany,
    detailsCompany,
    setDetailsCompany,
    form,
    formError,
    resetForm,
    openAddForm,
    openEditForm,
    handleSave,
    handleDelete,
    updateFormField,
    addAttachmentsToForm,
    updateFormAttachments,
  };
}
