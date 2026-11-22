"use client";

import { X } from "lucide-react";
import ImageGallery from "@/components/ImageGallery";
import type { Company } from "../types";

type CompanyDetailsDialogProps = {
  company: Company;
  onClose: () => void;
};

export default function CompanyDetailsDialog({
  company,
  onClose,
}: CompanyDetailsDialogProps) {
  const details = [
    ["الموبايل", company.mobile || "—"],
    ["السجل التجارى", company.commercialRegister || "—"],
  ];

  return (
    <div
      className="entity-edit__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="company-details-title"
        aria-modal="true"
        className="entity-edit__dialog max-h-[90vh] w-full max-w-3xl overflow-y-auto"
        role="dialog"
      >
        <header className="entity-edit__header">
          <div>
            <h2 id="company-details-title" className="entity-edit__title">
              تفاصيل الشركة
            </h2>
            <p className="mt-1 text-xs text-slate-500">{company.name}</p>
          </div>
          <button
            type="button"
            aria-label="إغلاق التفاصيل"
            className="entity-edit__close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 p-3">
              <dt className="text-[11px] text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4">
          <ImageGallery title="المرفقات" images={company.attachments} />
        </div>

        <footer className="entity-edit__actions">
          <button
            type="button"
            className="entity-edit__cancel"
            onClick={onClose}
          >
            إغلاق
          </button>
        </footer>
      </section>
    </div>
  );
}
