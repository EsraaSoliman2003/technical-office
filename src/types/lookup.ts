/** API resource name of a name-only lookup, e.g. "agencies", "sectors". */
export type LookupResource = string;

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
