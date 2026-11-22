"use client";

import { X } from "lucide-react";
import ImageGallery from "@/components/ImageGallery";
import type { Project, ProjectImage } from "../types";

type ProjectDetailsDialogProps = {
  project: Project;
  onClose: () => void;
};

export default function ProjectDetailsDialog({
  project,
  onClose,
}: ProjectDetailsDialogProps) {
  const details = [
    ["نسبة التنفيذ", project.executionPercentage ? `${project.executionPercentage}%` : "—"],
    ["تاريخ النهو", project.completionDate || "—"],
    ["المخصص", project.allocation || "—"],
    ["موقف المشروع", project.projectStatus || "—"],
    ["بلدورات", project.curbstones || "—"],
    ["رخام", project.marble || "—"],
    ["اسمنت", project.cement || "—"],
    ["حديد", project.iron || "—"],
  ];

  return (
    <div
      className="entity-edit__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="project-details-title"
        aria-modal="true"
        className="entity-edit__dialog max-h-[90vh] w-full max-w-3xl overflow-y-auto"
        role="dialog"
      >
        <header className="entity-edit__header">
          <div>
            <h2 id="project-details-title" className="entity-edit__title">
              تفاصيل المشروع
            </h2>
            <p className="mt-1 text-xs text-slate-500">{project.name}</p>
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
        <div className="mt-4 grid grid-cols-1 gap-4">
          <ImageGallery title="الخامات" images={project.materials} />
          <ImageGallery title="العروض" images={project.offers} />
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
