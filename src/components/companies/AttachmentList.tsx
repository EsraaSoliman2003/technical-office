"use client";

import { Download, Eye, FileText, Image as ImageIcon, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui";
import { formatFileSize, isImageType } from "@/lib/attachments";
import { formatDateTime } from "@/lib/formatDate";
import type { AttachmentDto } from "@/types/company";
import type { AttachmentBusy, AttachmentPreviewState } from "./useAttachmentFiles";

type AttachmentListProps = {
  attachments: AttachmentDto[];
  busy: AttachmentBusy;
  onView: (attachment: AttachmentDto) => void;
  onDownload: (attachment: AttachmentDto) => void;
  /** Shows "حذف" (Admin/Manager). */
  onDelete?: (attachment: AttachmentDto) => void;
  disabled?: boolean;
};

/** Saved attachments: name, size, date, who added it; عرض / تحميل / حذف. */
export function AttachmentList({ attachments, busy, onView, onDownload, onDelete, disabled }: AttachmentListProps) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {attachments.map((attachment) => {
        const Icon = isImageType(attachment.contentType) ? ImageIcon : FileText;
        const isBusy = busy?.id === attachment.id;
        return (
          <li key={attachment.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-text">
              <Icon size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p dir="auto" className="truncate text-sm font-semibold text-foreground" title={attachment.fileName}>
                {attachment.fileName}
              </p>
              <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span dir="ltr" className="tabular-nums">
                  {formatFileSize(attachment.sizeBytes)}
                </span>
                <span dir="ltr" className="tabular-nums">
                  {formatDateTime(attachment.createdAt)}
                </span>
                {attachment.createdByName && <span>{attachment.createdByName}</span>}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onView(attachment)}
                loading={isBusy && busy?.action === "view"}
                disabled={disabled || (busy !== null && !isBusy)}
                aria-label={`عرض ${attachment.fileName}`}
              >
                {!(isBusy && busy?.action === "view") && <Eye size={14} aria-hidden="true" />}
                عرض
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onDownload(attachment)}
                loading={isBusy && busy?.action === "download"}
                disabled={disabled || (busy !== null && !isBusy)}
                aria-label={`تحميل ${attachment.fileName}`}
              >
                {!(isBusy && busy?.action === "download") && <Download size={14} aria-hidden="true" />}
                تحميل
              </Button>
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(attachment)}
                  disabled={disabled || isBusy}
                  aria-label={`حذف ${attachment.fileName}`}
                  className="text-danger hover:bg-danger-soft"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  حذف
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Image preview inside a dialog (object URL owned by `useAttachmentFiles`). */
export function AttachmentPreview({ preview, onClose }: { preview: AttachmentPreviewState; onClose: () => void }) {
  return (
    <figure className="mt-4 overflow-hidden rounded-xl border border-border bg-surface-muted">
      <figcaption className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-sm">
        <span dir="auto" className="truncate font-semibold text-foreground">
          {preview.attachment.fileName}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق المعاينة"
          title="إغلاق المعاينة"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </figcaption>
      <img
        src={preview.url}
        alt={preview.attachment.fileName}
        className="mx-auto max-h-[50vh] w-auto object-contain"
      />
    </figure>
  );
}
