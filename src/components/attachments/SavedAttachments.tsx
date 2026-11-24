"use client";

import { useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { toast } from "sonner";
import { useFocusAfterRemoval } from "@/components/list/formHelpers";
import { ConfirmDialog } from "@/components/ui";
import type { AttachmentDto } from "@/types/attachment";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE } from "@/utils/apiFailure";
import { AttachmentList, AttachmentPreview } from "./AttachmentList";
import { useAttachmentFiles } from "./useAttachmentFiles";

type SavedAttachmentsProps = {
  attachments: AttachmentDto[];
  /** Attachments endpoint, e.g. `companies/{id}/attachments` (a file is `${baseUrl}/{attachmentId}`). */
  baseUrl: string;
  /** Deletes on the server after confirmation (an RTK mutation trigger); omit for read-only. */
  onRemove?: (attachment: AttachmentDto) => PromiseLike<{ error?: unknown }>;
  disabled?: boolean;
  /** Focus target when a deleted attachment's button disappears. */
  fallbackFocusRef: RefObject<HTMLElement | null>;
  /** Shown above the list (hidden when the list is empty). */
  heading?: ReactNode;
  /** Shown instead of the list when there are no attachments (default: nothing). */
  empty?: ReactNode;
};

/**
 * Saved attachments: عرض (image preview here / PDF in a new tab) / تحميل, and حذف with a
 * confirmation that calls the API immediately.
 * Keep it mounted when the list becomes empty (it renders `empty`), so focus still moves to
 * `fallbackFocusRef` after the last attachment is deleted.
 */
export function SavedAttachments({
  attachments,
  baseUrl,
  onRemove,
  disabled,
  fallbackFocusRef,
  heading,
  empty = null,
}: SavedAttachmentsProps) {
  const files = useAttachmentFiles(baseUrl);
  const [confirming, setConfirming] = useState<AttachmentDto | null>(null);
  const [removing, setRemoving] = useState(false);
  const removingRef = useRef(false);
  const ids = useMemo(() => attachments.map((attachment) => attachment.id), [attachments]);
  const markRemoved = useFocusAfterRemoval(ids, fallbackFocusRef);

  const confirmRemove = async () => {
    if (!confirming || !onRemove || removingRef.current) return;
    removingRef.current = true;
    setRemoving(true);
    let result;
    try {
      result = await onRemove(confirming);
    } finally {
      removingRef.current = false;
      setRemoving(false);
    }
    const removed = confirming;
    setConfirming(null);

    if (result.error) {
      const failure = isApiFailure(result.error) ? result.error : undefined;
      toast.error(failure?.status === 403 ? NO_PERMISSION_MESSAGE : getFailureMessage(failure));
      return;
    }
    toast.success("تم حذف المرفق");
    if (files.preview?.attachment.id === removed.id) files.closePreview();
    markRemoved(removed.id);
  };

  return (
    <>
      {attachments.length === 0 ? (
        empty
      ) : (
        <div className="flex flex-col gap-2">
          {heading}
          <AttachmentList
            attachments={attachments}
            busy={files.busy}
            onView={files.view}
            onDownload={files.download}
            onDelete={onRemove ? setConfirming : undefined}
            disabled={disabled}
          />
        </div>
      )}
      {files.preview && <AttachmentPreview preview={files.preview} onClose={files.closePreview} />}

      <ConfirmDialog
        open={confirming !== null}
        loading={removing}
        message={confirming ? `هل أنت متأكد من حذف المرفق "${confirming.fileName}"؟` : undefined}
        onConfirm={confirmRemove}
        onCancel={() => setConfirming(null)}
        fallbackFocusRef={fallbackFocusRef}
      />
    </>
  );
}
