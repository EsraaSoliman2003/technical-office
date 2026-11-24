"use client";

import { useOptionList } from "@/components/options/useOptionList";
import { useLookupOptionsQuery } from "@/rtk/endpoints/lookupApi";
import { useMaterialOptionsQuery, useProjectOptionsQuery } from "@/rtk/endpoints/projectApi";
import type { MaterialDeliveryItem } from "@/types/materialDelivery";

/**
 * The dropdown lists of a delivery (`/api/{…}/options`). `record`: the delivery being edited, so its
 * own names show even before the lists load. `full: false` (the list page) loads only projects and
 * materials (the filters).
 */
export function useDeliveryOptionLists(record?: MaterialDeliveryItem, { full = true }: { full?: boolean } = {}) {
  const skip = { skip: !full };
  return {
    projects: useOptionList(useProjectOptionsQuery(), record?.projectId, record?.projectName),
    materials: useOptionList(useMaterialOptionsQuery(), record?.materialId, record?.materialName),
    projectTypes: useOptionList(
      useLookupOptionsQuery("project-types", skip),
      record?.projectTypeId,
      record?.projectTypeName
    ),
    factories: useOptionList(useLookupOptionsQuery("factories", skip), record?.factoryId, record?.factoryName),
    mixers: useOptionList(useLookupOptionsQuery("mixers", skip), record?.mixerId, record?.mixerName),
    transportCompanies: useOptionList(
      useLookupOptionsQuery("transport-companies", skip),
      record?.transportCompanyId,
      record?.transportCompanyName
    ),
  };
}
