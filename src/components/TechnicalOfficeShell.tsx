"use client";

import type { ReactNode } from "react";
import Breadcrumbs from "./Breadcrumbs";
import TechnicalOfficeNavbar from "./TechnicalOfficeNavbar";

export default function TechnicalOfficeShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TechnicalOfficeNavbar />
      <Breadcrumbs />
      <main className="flex-1">{children}</main>
    </div>
  );
}
