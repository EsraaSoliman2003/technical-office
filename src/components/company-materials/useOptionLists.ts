"use client";

import { useMemo } from "react";
import type { ComboboxOption } from "@/components/ui";
import { useCompanyOptionsQuery } from "@/rtk/endpoints/companyApi";
import { useMaterialOptionsQuery, useProjectOptionsQuery } from "@/rtk/endpoints/projectApi";
import type { NamedOption } from "@/types/companyMaterial";

export type OptionList = {
  options: ComboboxOption[];
  /** Known ids; undefined until loaded (or when loading failed). */
  ids: string[] | undefined;
  loading: boolean;
  loadError: boolean;
  /** Name of an id, if it is in the list. */
  nameOf: (id: string | undefined) => string | undefined;
};

function useOptionList(
  result: { currentData?: NamedOption[]; isLoading: boolean; isError: boolean },
  extraId?: string,
  extraName?: string
): OptionList {
  const { currentData, isLoading, isError } = result;
  return useMemo(() => {
    const list = [...(currentData ?? [])];
    // The record's own value, so its name shows before the options load (or if it is missing).
    if (extraId && extraName && !list.some((option) => option.id === extraId)) {
      list.push({ id: extraId, name: extraName });
    }
    const names = new Map(list.map((option) => [option.id, option.name]));
    return {
      options: list.map((option) => ({ value: option.id, label: option.name })),
      ids: currentData?.map((option) => option.id),
      loading: isLoading,
      loadError: isError,
      nameOf: (id) => (id ? names.get(id) : undefined),
    };
  }, [currentData, isLoading, isError, extraId, extraName]);
}

/**
 * Projects, materials and companies for the dropdowns (`/api/{…}/options`). `record`: the row
 * being edited, so its own names show even before the lists load.
 */
export function useOptionLists(
  record?: {
    projectId: string;
    projectName: string;
    materialId: string;
    materialName: string;
    companyId: string;
    companyName: string;
  }
) {
  return {
    projects: useOptionList(useProjectOptionsQuery(), record?.projectId, record?.projectName),
    materials: useOptionList(useMaterialOptionsQuery(), record?.materialId, record?.materialName),
    companies: useOptionList(useCompanyOptionsQuery(), record?.companyId, record?.companyName),
  };
}
