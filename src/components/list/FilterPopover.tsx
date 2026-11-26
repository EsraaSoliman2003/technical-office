"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type FilterPopoverProps = {
  anchor: HTMLElement | null;
  ariaLabel: string;
  className: string;
  onClose: () => void;
  children: ReactNode;
};

export default function FilterPopover({
  anchor,
  ariaLabel,
  className,
  onClose,
  children,
}: FilterPopoverProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!anchor) return;

    const updatePosition = () => {
      const menu = menuRef.current;
      if (!menu) return;

      const anchorRect = anchor.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const margin = 8;
      const gap = 8;
      const spaceBelow = window.innerHeight - anchorRect.bottom - margin;
      const spaceAbove = anchorRect.top - margin;
      const openBelow = menuRect.height + gap <= spaceBelow || spaceBelow >= spaceAbove;
      const maxTop = window.innerHeight - margin - menuRect.height;
      const top = openBelow
        ? Math.min(anchorRect.bottom + gap, maxTop)
        : Math.max(margin, anchorRect.top - gap - menuRect.height);
      const maxLeft = window.innerWidth - margin - menuRect.width;
      const left = Math.max(
        margin,
        Math.min(anchorRect.left + anchorRect.width / 2 - menuRect.width / 2, maxLeft)
      );

      setPosition({ top: Math.max(margin, top), left });
    };

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !menuRef.current?.contains(target) &&
        !anchor.contains(target)
      ) {
        onClose();
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updatePosition);
    if (menuRef.current && resizeObserver) resizeObserver.observe(menuRef.current);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      resizeObserver?.disconnect();
    };
  }, [anchor, onClose]);

  if (!anchor) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="dialog"
      aria-label={ariaLabel}
      dir="rtl"
      className={className}
      style={{
        position: "fixed",
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        zIndex: 1000,
        maxWidth: "calc(100vw - 16px)",
        maxHeight: "calc(100vh - 16px)",
        overflowY: "auto",
        visibility: position ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body
  );
}
