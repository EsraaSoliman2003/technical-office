"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, CircleUserRound, LogOut, Moon, Settings, Sun, type LucideIcon } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme";
import { useAppSelector } from "@/rtk/hooks";

type MenuItemProps = {
  icon: LucideIcon;
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
  hint?: string;
};

function MenuItem({ icon: Icon, label, onSelect, disabled, danger, hint }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      aria-disabled={disabled || undefined}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm",
        disabled
          ? "text-muted-foreground opacity-60"
          : danger
            ? "text-danger hover:bg-danger-soft focus-visible:bg-danger-soft"
            : "text-foreground hover:bg-surface-muted focus-visible:bg-surface-muted"
      )}
    >
      <Icon size={18} aria-hidden="true" className="shrink-0" />
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </button>
  );
}

export default function UserMenu() {
  const fullName = useAppSelector((state) => state.auth.fullName);
  const logout = useLogout();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []
      );
      if (items.length === 0) return;
      event.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next = event.key === "ArrowDown" ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
      items[next].focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 ps-1 pe-3 text-sm font-semibold text-foreground hover:bg-surface-muted"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary-text">
          <CircleUserRound size={20} aria-hidden="true" />
        </span>
        <span className="max-w-[9rem] truncate sm:max-w-[14rem]">{fullName}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn("text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="قائمة المستخدم"
          className="absolute left-0 top-full z-40 mt-2 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-xl"
        >
          <MenuItem icon={Settings} label="الإعدادات" disabled hint="قريبًا" />
          <MenuItem
            icon={theme === "dark" ? Sun : Moon}
            label="تبديل المظهر"
            hint={theme === "dark" ? "داكن" : "فاتح"}
            onSelect={toggleTheme}
          />
          <div className="my-1 h-px bg-border" role="separator" />
          <MenuItem
            icon={LogOut}
            label="تسجيل الخروج"
            danger
            onSelect={() => {
              setOpen(false);
              logout();
            }}
          />
        </div>
      )}
    </div>
  );
}
