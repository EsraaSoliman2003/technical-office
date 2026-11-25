import type { AttachmentDto } from "./attachment";
import type { AuditFields, ListParams, PagedResult } from "./paged";

export type ContractAttachmentCategory = "consultantReview" | "approvedQuantities" | "irSubmittal";

/** A stage or status from `/api/contracts/meta` (labels and order come from the server). */
export type ContractMetaItem = { value: string; label: string };
export type ContractMeta = {
  stages: ContractMetaItem[];
  statuses: ContractMetaItem[];
  /** موقف السلفة values in journey order (None … Paid). */
  advanceStatuses: ContractMetaItem[];
};

/** The journey dates ("yyyy-MM-dd" or null), in order. */
export const CONTRACT_DATE_FIELDS = [
  "boqSubmissionDate",
  "supplySubmissionDate",
  "authoritySubmissionDate",
  "authorityReturnDate",
  "authorityReturnForCompletionDate",
  "cardPrintDate",
  "bookletsDeliveryDate",
  "fundingDate",
  "contractDate",
] as const;
export type ContractDateField = (typeof CONTRACT_DATE_FIELDS)[number];

/** The money/rate values (null = empty). */
export const CONTRACT_VALUE_FIELDS = [
  "battalionValue",
  "managementValue",
  "authorityValue",
  "discountValue",
  "overrunValue",
  "overrunPercent",
  "ironRate",
  "cementRate",
] as const;
export type ContractValueField = (typeof CONTRACT_VALUE_FIELDS)[number];

/** السلفة's dates ("yyyy-MM-dd" or null), in journey order. */
export const CONTRACT_ADVANCE_DATE_FIELDS = [
  "advanceBrigadeDate",
  "advanceManagementDate",
  "advanceAuthorityDate",
  "advanceCentralDate",
  "advancePaymentDate",
] as const;
export type ContractAdvanceDateField = (typeof CONTRACT_ADVANCE_DATE_FIELDS)[number];

export type ContractItem = AuditFields &
  Record<ContractDateField, string | null> &
  Record<ContractValueField, number | null> &
  Record<ContractAdvanceDateField, string | null> & {
    id: string;
    contractNumber: string;
    name: string;
    projectTypeId: string | null;
    projectTypeName: string | null;
    projectId: string;
    projectName: string;
    companyId: string;
    companyName: string;
    /** موقف العقد: calculated by the server from the dates (never sent). */
    status: string;
    stage: string | null;
    notes: string | null;
    returnReason: string | null;
    /** = authorityValue ?? managementValue ?? battalionValue (server). */
    contractValue: number | null;
    attachmentCounts: Record<ContractAttachmentCategory, number>;
    /** الأوراق المستلمة: all papers / those received and not sent out yet (server). */
    paperCount: number;
    pendingPaperCount: number;
    /** قيمة السلفة (null = none). */
    advanceValue: number | null;
    /** موقف السلفة: calculated by the server from the advance value and dates (never sent). */
    advanceStatus: string;
  };

export type ContractAttachmentDto = AttachmentDto & { category: ContractAttachmentCategory };

export type ContractDto = ContractItem & { attachments: ContractAttachmentDto[] };

export type ContractSortBy =
  | "contractNumber"
  | "name"
  | "projectName"
  | "companyName"
  | "contractValue"
  | "status"
  | "contractDate"
  | "advanceStatus"
  | "advanceValue"
  | "advancePaymentDate"
  | "createdAt"
  | "updatedAt";

/** The list filters: رقم العقد is an exact match. */
export type ContractFilters = {
  contractNumber?: string;
  projectId?: string;
  companyId?: string;
  status?: string;
  stage?: string;
  /** موقف السلفة. */
  advanceStatus?: string;
  /** "true" = only contracts with pending papers (الأوراق المعلقة). */
  hasPendingPapers?: string;
};

export type ContractListParams = ListParams<ContractSortBy> & ContractFilters;

/** `/export`: same filters and sort, no paging. */
export type ContractExportParams = Omit<ContractListParams, "page" | "pageSize">;

/** The page plus the total value and the count per status ("all" = every status) for the other filters. */
/** The counter buttons (from the server): every status in journey order, for all filters except status. */
export type ContractStatusCounts = {
  all: number;
  statuses: { status: string; count: number }[];
};

/** The السلفة counter row (from the server): count per advance status, and contracts with pending papers. */
export type ContractAdvanceCounts = {
  statuses: { status: string; count: number }[];
  pendingPapers: number;
};

export type ContractPage = PagedResult<ContractItem> & {
  totalValue: number;
  statusCounts: ContractStatusCounts;
  /** إجمالي السلف. */
  totalAdvanceValue: number;
  advanceCounts: ContractAdvanceCounts;
};

export type SaveContractRequest = Omit<
  ContractItem,
  | keyof AuditFields
  | "id"
  | "projectTypeName"
  | "projectName"
  | "companyName"
  | "status"
  | "contractValue"
  | "attachmentCounts"
  | "paperCount"
  | "pendingPaperCount"
  | "advanceStatus"
>;

/** A paper received for a contract (الأوراق المستلمة خاصة بالمشروع). */
export type ContractPaperDto = AuditFields & {
  id: string;
  contractId: string;
  subject: string;
  /** "yyyy-MM-dd" or null. */
  receivedDate: string | null;
  exitDate: string | null;
  notes: string | null;
  /** Received, not sent out yet (server). */
  isPending: boolean;
  attachments: AttachmentDto[];
};

export type SaveContractPaperRequest = Pick<ContractPaperDto, "subject" | "receivedDate" | "exitDate" | "notes">;
