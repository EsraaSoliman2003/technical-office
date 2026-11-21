"use client";

import type { ReactNode } from "react";
import { BreadcrumbProvider } from "./BreadcrumbContext";
import Breadcrumbs from "./Breadcrumbs";
import TechnicalOfficeNavbar from "./TechnicalOfficeNavbar";

export default function TechnicalOfficeShell({ children }: { children: ReactNode }) {
  return (
    <BreadcrumbProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <TechnicalOfficeNavbar />
        <Breadcrumbs />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </BreadcrumbProvider>
  );
}
