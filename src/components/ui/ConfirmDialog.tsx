"use client";

import { useRef, type RefObject } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Shows a spinner on the confirm button and blocks closing. */
  loading?: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** Focus target on close if the opening element is gone (see `Modal`). */
  fallbackFocusRef?: RefObject<HTMLElement | null>;
};

/** Delete confirmation (Arabic defaults). Focus starts on "إلغاء" so Enter never deletes by accident. */
export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  loading = false,
  title = "تأكيد الحذف",
  message = "هل أنت متأكد من حذف هذا العنصر؟",
  confirmText = "حذف",
  cancelText = "إلغاء",
  fallbackFocusRef,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      initialFocusRef={cancelRef}
      fallbackFocusRef={fallbackFocusRef}
      preventClose={loading}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertTriangle size={20} aria-hidden="true" />
        </div>
        <p className="pt-2 text-sm leading-6 text-foreground">{message}</p>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
