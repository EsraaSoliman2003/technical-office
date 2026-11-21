/** API resource of a name-only lookup ("agencies" | "sectors" | …), derived from the `LOOKUPS` list. */
export type { LookupResource } from "@/lib/lookups";

export type LookupDto = {
  id: string;
  name: string;
  /** ISO UTC */
  createdAt: string;
  createdByName: string | null;
  /** ISO UTC */
  updatedAt: string | null;
  updatedByName: string | null;
};

export type LookupSortBy = "name" | "createdAt" | "updatedAt";
export type SortDir = "asc" | "desc";

export type LookupListParams = {
  search?: string;
  page: number;
  pageSize: number;
  sortBy: LookupSortBy;
  sortDir: SortDir;
};

export type LookupInput = {
  name: string;
};
