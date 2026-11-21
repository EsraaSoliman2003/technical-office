"use client";

import { useLogout } from "@/hooks/useLogout";
import {
  Bell,
  LogOut,
  PanelLeft,
} from "lucide-react";

type TechnicalOfficeNavbarProps = {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export default function TechnicalOfficeNavbar({
  isSidebarOpen,
  onToggleSidebar,
}: TechnicalOfficeNavbarProps) {
  const logout = useLogout();

  return (
    <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-6">
      <button
        type="button"
        aria-label={isSidebarOpen ? "إغلاق القائمة الجانبية" : "فتح القائمة الجانبية"}
        aria-expanded={isSidebarOpen}
        aria-controls="technical-office-sidebar"
        onClick={onToggleSidebar}
        className="rounded p-2 text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#103462]"
      >
        <PanelLeft className="rotate-180" size={20} />
      </button>

      {/* <h1 className="text-center text-lg font-bold text-slate-800 md:text-xl">
        إدارة الأشغال العسكرية
      </h1> */}

      <div className="flex items-center gap-3">
        {/* <button
          type="button"
          aria-label="الإشعارات"
          className="relative text-slate-500 transition hover:text-slate-800"
        >
          <Bell size={20} />
          <span className="absolute right-0 top-0 h-2 w-2 rounded-full border border-white bg-red-500" />
        </button> */}
        <button
          onClick={logout}
          type="button"
          aria-label="تسجيل الخروج"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-600/30 bg-red-600/10 text-red-600 transition hover:border-red-500/60 hover:bg-red-600/20"
        >
          <LogOut className="rotate-180" size={16} />
        </button>
      </div>
    </header>
  );
}
