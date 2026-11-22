"use client";

import { X } from "lucide-react";
import type { ProjectMaterial } from "../types";

type ProjectMaterialDetailsDialogProps = {
  projectMaterial: ProjectMaterial;
  onClose: () => void;
};

export default function ProjectMaterialDetailsDialog({
  projectMaterial,
  onClose,
}: ProjectMaterialDetailsDialogProps) {
  const details = [
    ["رقم التفويض", projectMaterial.authorizationNumber],
    ["نوع المشروع", projectMaterial.projectType],
    ["المشروع", projectMaterial.projectName],
    ["رقم البوليصة", projectMaterial.billOfLadingNumber],
    ["تاريخ البوليصة", projectMaterial.billDate],
    ["الكمية", Number(projectMaterial.quantity).toLocaleString("en-US")],
    ["الخامة", projectMaterial.material],
    ["إذن التحميل", projectMaterial.loadingPermitNumber],
    ["رقم أمر البيع", projectMaterial.salesOrderNumber],
    ["رقم السيارة", projectMaterial.vehicleNumber],
    ["اسم السائق", projectMaterial.driverName],
    ["المصنع", projectMaterial.factory],
    ["الخلاطة", projectMaterial.mixer],
    ["شركة النقل", projectMaterial.transportCompany],
    ["تاريخ الاستلام", projectMaterial.receivedDate],
    ["تاريخ الخروج", projectMaterial.exitDate],
    ["ملاحظات", projectMaterial.notes || "—"],
  ];

  return (
    <div
      className="entity-edit__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="project-material-details-title"
        aria-modal="true"
        className="entity-edit__dialog max-h-[90vh] w-full max-w-4xl overflow-y-auto"
        role="dialog"
      >
        <header className="entity-edit__header">
          <div>
            <h2
              id="project-material-details-title"
              className="entity-edit__title"
            >
              تفاصيل خامة المشروع
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {projectMaterial.projectName} — {projectMaterial.material}
            </p>
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
              <dd className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-800">
                {value || "—"}
              </dd>
            </div>
          ))}
          <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
            <dt className="text-[11px] text-slate-500">مرفق البوليصة</dt>
            <dd className="mt-2">
              {projectMaterial.billAttachment ? (
                <img
                  src={projectMaterial.billAttachment.src}
                  alt={projectMaterial.billAttachment.name}
                  className="max-h-96 max-w-full rounded-lg object-contain"
                />
              ) : (
                <span className="text-sm text-slate-500">
                  لا توجد صورة مرفقة
                </span>
              )}
            </dd>
          </div>
        </dl>

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
