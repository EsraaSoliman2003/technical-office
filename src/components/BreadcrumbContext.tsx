"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type BreadcrumbContextValue = {
  /** Labels registered by pages, keyed by route segment. */
  labels: Record<string, string>;
  setLabel: (segment: string, label: string) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue>({ labels: {}, setLabel: () => {} });

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const setLabel = useCallback((segment: string, label: string) => {
    setLabels((current) => (current[segment] === label ? current : { ...current, [segment]: label }));
  }, []);

  const value = useMemo(() => ({ labels, setLabel }), [labels, setLabel]);
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

export function useBreadcrumbLabels() {
  return useContext(BreadcrumbContext).labels;
}

/** Lets a page name its own route segment in the breadcrumb (for segments not in the static map). */
export function useBreadcrumbLabel(segment: string | undefined, label: string) {
  const { setLabel } = useContext(BreadcrumbContext);
  useEffect(() => {
    if (segment) setLabel(segment, label);
  }, [segment, label, setLabel]);
}
