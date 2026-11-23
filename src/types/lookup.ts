import type { AuditFields, ListParams, SortDir } from "./paged";

/** API resource of a name-only lookup ("agencies" | "sectors" | …), derived from the `LOOKUPS` list. */
export type { LookupResource } from "@/lib/lookups";
export type { SortDir };

export type LookupDto = AuditFields & {
  id: string;
  name: string;
};

export type LookupSortBy = "name" | "createdAt" | "updatedAt";

export type LookupListParams = ListParams<LookupSortBy>;

export type LookupInput = {
  name: string;
};
