"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/lib/theme";

export default function AppToaster() {
  const { theme } = useTheme();
  return <Toaster richColors position="top-center" dir="rtl" theme={theme} />;
}
