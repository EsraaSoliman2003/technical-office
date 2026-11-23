"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ModalSize = "sm" | "md" | "lg";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  /**
   * Element to focus when the modal opens. Defaults to an element with `data-autofocus`,
   * then the first focusable element. (Prefer these over React's `autoFocus`.)
   */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /**
   * Where focus goes on close when the element that opened the modal no longer exists
   * (e.g. a deleted row's button). Without it focus would fall back to <body>.
   */
  fallbackFocusRef?: RefObject<HTMLElement | null>;
  /** Close when clicking the backdrop (default true). */
  closeOnBackdrop?: boolean;
  /** Prevent closing (Esc, backdrop, X), e.g. while saving. */
  preventClose?: boolean;
  className?: string;
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
  );
}

/** Open modals, last = top-most. Only the top one handles Esc/Tab (a confirmation over a form dialog). */
const openPanels: HTMLElement[] = [];

/** On close: back to the opener, or to the fallback when the opener was removed. Reads the ref at close time on purpose. */
function restoreFocus(previouslyFocused: HTMLElement | null, fallbackFocusRef?: RefObject<HTMLElement | null>) {
  if (previouslyFocused?.isConnected) previouslyFocused.focus();
  else fallbackFocusRef?.current?.focus();
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  initialFocusRef,
  fallbackFocusRef,
  closeOnBackdrop = true,
  preventClose = false,
  className,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Latest callbacks/flags, read from event handlers without re-running the open effect.
  const onCloseRef = useRef(onClose);
  const preventCloseRef = useRef(preventClose);
  useEffect(() => {
    onCloseRef.current = onClose;
    preventCloseRef.current = preventClose;
  });

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const active = document.activeElement as HTMLElement | null;
    const previouslyFocused = active && !panel.contains(active) ? active : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (!panel.contains(document.activeElement)) {
      const target =
        initialFocusRef?.current ??
        panel.querySelector<HTMLElement>("[data-autofocus]") ??
        getFocusable(panel)[0] ??
        panel;
      target.focus();
    }

    openPanels.push(panel);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (openPanels[openPanels.length - 1] !== panel) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        if (!preventCloseRef.current) onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      openPanels.splice(openPanels.indexOf(panel), 1);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocus(previouslyFocused, fallbackFocusRef);
    };
  }, [open, initialFocusRef, fallbackFocusRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div dir="rtl" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
        onClick={() => {
          if (closeOnBackdrop && !preventClose) onClose();
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface text-foreground shadow-2xl",
          sizeClasses[size],
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="إغلاق"
            onClick={onClose}
            disabled={preventClose}
            className="-m-1 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {children && <div className="overflow-y-auto px-5 py-4">{children}</div>}

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface-muted/50 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
