"use client";

import { useRef } from "react";
import { AlertTriangle, Paperclip } from "lucide-react";
import { useListFallbackFocus } from "@/components/list/ListPage";
import { Button, EmptyState, Modal, Spinner } from "@/components/ui";
import type { AttachmentDto } from "@/types/attachment";
import { getFailureMessage, isApiFailure } from "@/utils/apiFailure";
import { SavedAttachments } from "./SavedAttachments";

type AttachmentsViewerDialogProps = {
  title: string;
  description?: string;
  /** Undefined while loading. */
  attachments: AttachmentDto[] | undefined;
  isFetching: boolean;
  isError: boolean;
  error?: unknown;
  refetch: () => unknown;
  baseUrl: string;
  /** Admin/Manager only. */
  onRemove?: (attachment: AttachmentDto) => PromiseLike<{ error?: unknown }>;
  onClose: () => void;
};

/** Read/download a record's attachments (and delete for Admin/Manager). Render inside `ListPage`. */
export function AttachmentsViewerDialog({
  title,
  description,
  attachments,
  isFetching,
  isError,
  error,
  refetch,
  baseUrl,
  onRemove,
  onClose,
}: AttachmentsViewerDialogProps) {
  const listFallbackFocusRef = useListFallbackFocus();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  let body;
  if (!attachments && isFetching) {
    body = (
      <div className="flex justify-center py-10 text-primary-text">
        <Spinner size={28} />
      </div>
    );
  } else if (!attachments && isError) {
    body = (
      <EmptyState
        icon={AlertTriangle}
        title="تعذر تحميل المرفقات"
        description={getFailureMessage(isApiFailure(error) ? error : undefined)}
        action={
          <Button variant="secondary" onClick={() => refetch()}>
            إعادة المحاولة
          </Button>
        }
      />
    );
  } else if (!attachments || attachments.length === 0) {
    body = <EmptyState icon={Paperclip} title="لا توجد مرفقات" />;
  } else {
    body = (
      <SavedAttachments
        attachments={attachments}
        baseUrl={baseUrl}
        onRemove={onRemove}
        fallbackFocusRef={closeButtonRef}
      />
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      fallbackFocusRef={listFallbackFocusRef}
      footer={
        <Button ref={closeButtonRef} variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      {body}
    </Modal>
  );
}
