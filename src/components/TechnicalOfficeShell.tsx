"use client";

import { useState, type ReactNode } from "react";
import TechnicalOfficeNavbar from "./TechnicalOfficeNavbar";
import TechnicalOfficeSidebar from "./TechnicalOfficeSidebar";

export default function TechnicalOfficeShell({
  children,
}: {
  children: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#f4f7fb] font-sans text-slate-800 font-expo"
    >
      <TechnicalOfficeSidebar isOpen={isSidebarOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TechnicalOfficeNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)}
        />
        {children}
      </div>
    </div>
  );
}
