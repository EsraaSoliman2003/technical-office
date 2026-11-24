import type { AttachmentDto } from "./attachment";
import type { AuditFields, ListParams, PagedResult } from "./paged";

/** One delivery (one bill of lading / truck) of a material to a project. Dates are "yyyy-MM-dd". */
export type MaterialDeliveryItem = AuditFields & {
  id: string;
  authorizationNumber: string | null;
  billOfLadingNumber: string | null;
  billDate: string | null;
  projectTypeId: string | null;
  projectTypeName: string | null;
  projectId: string;
  projectName: string;
  materialId: string;
  materialName: string;
  quantity: number;
  loadingPermitNumber: string | null;
  salesOrderNumber: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  factoryId: string | null;
  factoryName: string | null;
  mixerId: string | null;
  mixerName: string | null;
  transportCompanyId: string | null;
  transportCompanyName: string | null;
  receivedDate: string | null;
  exitDate: string | null;
  notes: string | null;
  attachmentCount: number;
};

export type MaterialDeliveryDto = MaterialDeliveryItem & { attachments: AttachmentDto[] };

export type MaterialDeliverySortBy =
  | "authorizationNumber"
  | "billOfLadingNumber"
  | "billDate"
  | "projectName"
  | "materialName"
  | "quantity"
  | "createdAt"
  | "updatedAt";

/** The list filters: رقم التفويض and رقم البوليصة are exact matches. */
export type MaterialDeliveryFilters = {
  authorizationNumber?: string;
  projectId?: string;
  materialId?: string;
  billOfLadingNumber?: string;
};

export type MaterialDeliveryListParams = ListParams<MaterialDeliverySortBy> & MaterialDeliveryFilters;

/** `/export`: same filters and sort, no paging. */
export type MaterialDeliveryExportParams = Omit<MaterialDeliveryListParams, "page" | "pageSize">;

/** The page plus the total quantity of all rows matching the filters. */
export type MaterialDeliveryPage = PagedResult<MaterialDeliveryItem> & { totalQuantity: number };

/** `/totals`: the project's approved quantity of the material (null = not set) and what was dispensed. */
export type MaterialDeliveryTotals = { approved: number | null; dispensed: number };

export type MaterialDeliveryTotalsParams = { projectId: string; materialId: string; excludeId?: string };

export type SaveMaterialDeliveryRequest = Omit<
  MaterialDeliveryItem,
  | keyof AuditFields
  | "id"
  | "projectTypeName"
  | "projectName"
  | "materialName"
  | "factoryName"
  | "mixerName"
  | "transportCompanyName"
  | "attachmentCount"
>;
