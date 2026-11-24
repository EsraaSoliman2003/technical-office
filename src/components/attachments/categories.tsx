"use client";

import type { RefObject } from "react";
import { Paperclip } from "lucide-react";
import { uploadAttachments } from "@/lib/attachmentTransfer";
import { cn } from "@/lib/cn";
import type { AttachmentDto } from "@/types/attachment";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE } from "@/utils/apiFailure";
import { AttachmentUploadField } from "./AttachmentUploadField";
import { SavedAttachments } from "./SavedAttachments";
import type { PendingFiles } from "./usePendingFiles";

/**
 * Uploads each category's new files (one request per category, `?category=`), one after the other.
 * Successful categories are cleared; a failed one keeps its files (with the server's per-file
 * errors) for a retry. Returns "<label> (<reason>)" for each failed category. The caller
 * invalidates its cache tags afterwards.
 */
export async function uploadCategoryFiles<C extends string>({
  url,
  categories,
  filesOf,
  labels,
}: {
  url: string;
  categories: readonly C[];
  filesOf: Record<C, PendingFiles>;
  labels: Record<C, string>;
}): Promise<string[]> {
  const failures: string[] = [];
  for (const category of categories) {
    const files = filesOf[category];
    const sent = files.files;
    if (sent.length === 0) continue;
    files.setProgress(0);
    try {
      await uploadAttachments(url, sent, { params: { category }, onProgress: files.setProgress });
      files.clear();
    } catch (error) {
      const failure = isApiFailure(error) ? error : undefined;
      const hasFileErrors = files.showServerErrors(failure, sent);
      const reason =
        failure?.status === 403 ? NO_PERMISSION_MESSAGE : hasFileErrors ? null : getFailureMessage(failure);
      failures.push(`${labels[category]}${reason ? ` (${reason})` : ""}`);
    } finally {
      files.setProgress(undefined);
    }
  }
  return failures;
}

type CategoryAttachmentsFieldProps = {
  label: string;
  files: PendingFiles;
  pickButtonRef: RefObject<HTMLButtonElement | null>;
  /** Saved files of this category (once the record exists and is loaded). */
  existing: AttachmentDto[] | undefined;
  /** The record's attachments endpoint (null while the record is new). */
  baseUrl: string | null;
  onRemove: (attachment: AttachmentDto) => PromiseLike<{ error?: unknown }>;
  disabled?: boolean;
};

/** One attachment category in a form: new files (pick / drop) and the saved ones (عرض / تحميل / حذف). */
export function CategoryAttachmentsField({
  label,
  files,
  pickButtonRef,
  existing,
  baseUrl,
  onRemove,
  disabled,
}: CategoryAttachmentsFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <AttachmentUploadField label={label} files={files} disabled={disabled} pickButtonRef={pickButtonRef} />
      {baseUrl && existing && (
        <SavedAttachments
          attachments={existing}
          baseUrl={baseUrl}
          onRemove={onRemove}
          disabled={disabled}
          fallbackFocusRef={pickButtonRef}
          heading={<p className="text-xs font-semibold text-muted-foreground">المرفقات المحفوظة: {label}</p>}
        />
      )}
    </div>
  );
}

/**
 * A list row's "<label> (n)" button per category, opening the viewer for that category. Always
 * enabled (focus returns here after the viewer; it shows "لا توجد مرفقات" for 0).
 */
export function CategoryAttachmentButtons<C extends string>({
  categories,
  labels,
  counts,
  itemName,
  onOpen,
}: {
  categories: readonly C[];
  labels: Record<C, string>;
  counts: Record<C, number>;
  /** The row's name, for screen readers. */
  itemName: string;
  onOpen: (category: C) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {categories.map((category) => {
        const count = counts[category] ?? 0;
        const label = labels[category];
        return (
          <button
            key={category}
            type="button"
            onClick={() => onOpen(category)}
            aria-label={`عرض مرفقات ${label} - ${itemName} (${count})`}
            title={`عرض مرفقات ${label}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-semibold whitespace-nowrap hover:border-primary/40 hover:bg-primary-soft hover:text-primary-text",
              count > 0 ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Paperclip size={13} aria-hidden="true" />
            {label} (<span className="tabular-nums">{count}</span>)
          </button>
        );
      })}
    </div>
  );
}
