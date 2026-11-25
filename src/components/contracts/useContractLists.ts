"use client";

import { useLabeledList, useOptionList } from "@/components/options/useOptionList";
import { useCompanyOptionsQuery } from "@/rtk/endpoints/companyApi";
import { useContractMetaQuery } from "@/rtk/endpoints/contractApi";
import { useLookupOptionsQuery } from "@/rtk/endpoints/lookupApi";
import { useProjectOptionsQuery } from "@/rtk/endpoints/projectApi";
import type { ContractItem } from "@/types/contract";

/**
 * Dropdown lists for contracts: projects, companies, project types (`/options`) and the stages /
 * statuses / advance statuses from `/api/contracts/meta`. `record`: the contract being edited, so its
 * own names show even before the lists load. `full: false` (the list page) skips the project types.
 */
export function useContractLists(record?: ContractItem, { full = true }: { full?: boolean } = {}) {
  const meta = useContractMetaQuery();
  return {
    projects: useOptionList(useProjectOptionsQuery(), record?.projectId, record?.projectName),
    companies: useOptionList(useCompanyOptionsQuery(), record?.companyId, record?.companyName),
    projectTypes: useOptionList(
      useLookupOptionsQuery("project-types", { skip: !full }),
      record?.projectTypeId,
      record?.projectTypeName
    ),
    stages: useLabeledList(meta.currentData?.stages, meta.isLoading, meta.isError),
    statuses: useLabeledList(meta.currentData?.statuses, meta.isLoading, meta.isError),
    advanceStatuses: useLabeledList(meta.currentData?.advanceStatuses, meta.isLoading, meta.isError),
  };
}
