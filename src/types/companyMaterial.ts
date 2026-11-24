import type { AttachmentDto } from "./attachment";
import type { AuditFields, ListParams, PagedResult } from "./paged";

export type CompanyMaterialItem = AuditFields & {
  id: string;
  loadingPermitNumber: string | null;
  projectId: string;
  projectName: string;
  materialId: string;
  materialName: string;
  companyId: string;
  companyName: string;
  quantity: number;
  receivingEngineer: string | null;
  notes: string | null;
  attachmentCount: number;
};

export type CompanyMaterialDto = CompanyMaterialItem & { attachments: AttachmentDto[] };

export type CompanyMaterialSortBy =
  | "loadingPermitNumber"
  | "projectName"
  | "materialName"
  | "companyName"
  | "quantity"
  | "createdAt"
  | "updatedAt";

/** The list filters (`?projectId=&materialId=&companyId=`). */
export type CompanyMaterialFilters = {
  projectId?: string;
  materialId?: string;
  companyId?: string;
};

export type CompanyMaterialListParams = ListParams<CompanyMaterialSortBy> & CompanyMaterialFilters;

/** `/export`: same filters and sort, no paging. */
export type CompanyMaterialExportParams = Omit<CompanyMaterialListParams, "page" | "pageSize">;

/** The page plus the total quantity of all rows matching the filters. */
export type CompanyMaterialPage = PagedResult<CompanyMaterialItem> & { totalQuantity: number };

export type SaveCompanyMaterialRequest = {
  loadingPermitNumber: string | null;
  projectId: string;
  materialId: string;
  companyId: string;
  quantity: number;
  receivingEngineer: string | null;
  notes: string | null;
};

/** `{ id, name }` from `/api/{projects|materials|companies}/options`. */
export type NamedOption = { id: string; name: string };
