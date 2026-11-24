"use client";

import { useOptionList } from "@/components/options/useOptionList";
import { useCompanyOptionsQuery } from "@/rtk/endpoints/companyApi";
import { useMaterialOptionsQuery, useProjectOptionsQuery } from "@/rtk/endpoints/projectApi";

/**
 * Projects, materials and companies for the dropdowns (`/api/{…}/options`). `record`: the row
 * being edited, so its own names show even before the lists load.
 */
export function useOptionLists(record?: {
  projectId: string;
  projectName: string;
  materialId: string;
  materialName: string;
  companyId: string;
  companyName: string;
}) {
  return {
    projects: useOptionList(useProjectOptionsQuery(), record?.projectId, record?.projectName),
    materials: useOptionList(useMaterialOptionsQuery(), record?.materialId, record?.materialName),
    companies: useOptionList(useCompanyOptionsQuery(), record?.companyId, record?.companyName),
  };
}
