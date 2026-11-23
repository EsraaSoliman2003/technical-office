export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type SortDir = "asc" | "desc";

/** Query string of a paged list endpoint (`?search=&page=&pageSize=&sortBy=&sortDir=`). */
export type ListParams<TSortBy extends string> = {
  search?: string;
  page: number;
  pageSize: number;
  sortBy: TSortBy;
  sortDir: SortDir;
};

/** Audit fields every list item from the API has (ISO UTC dates). */
export type AuditFields = {
  createdAt: string;
  createdByName: string | null;
  updatedAt: string | null;
  updatedByName: string | null;
};
