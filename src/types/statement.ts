import type { AttachmentDto } from "./attachment";
import type { ContractMetaItem } from "./contract";
import type { AuditFields, ListParams, PagedResult } from "./paged";

/** Statuses and دفعة values with their Arabic labels, in order (`/api/statements/meta`). */
export type StatementMeta = { statuses: ContractMetaItem[]; installments: ContractMetaItem[] };

/** مسار المستخلص: the dates ("yyyy-MM-dd" or null), in journey order. */
export const STATEMENT_DATE_FIELDS = [
  "battalionDate",
  "brigadeDate",
  "managementDate",
  "authorityDate",
  "centralDate",
  "paymentDate",
] as const;
export type StatementDateField = (typeof STATEMENT_DATE_FIELDS)[number];

/** Amounts typed in the form (null = empty). صافي الصرف is typed for now (calculated? to confirm with the client). */
export const STATEMENT_OPTIONAL_AMOUNT_FIELDS = ["ironValue", "cementValue", "netPayment"] as const;
export type StatementOptionalAmountField = (typeof STATEMENT_OPTIONAL_AMOUNT_FIELDS)[number];

/** Short optional texts (الرتبة, الضابط, موقف التامينات, جواب مركزية, التكويد). */
export const STATEMENT_TEXT_FIELDS = [
  "officerRank",
  "officerName",
  "insuranceStatus",
  "centralLetter",
  "coding",
] as const;
export type StatementTextField = (typeof STATEMENT_TEXT_FIELDS)[number];

export type StatementItem = AuditFields &
  Record<StatementDateField, string | null> &
  Record<StatementOptionalAmountField, number | null> &
  Record<StatementTextField, string | null> & {
    id: string;
    contractId: string;
    contractNumber: string;
    contractName: string;
    projectName: string;
    companyName: string;
    companyCommercialRegister: string | null;
    contractValue: number | null;
    /** قيمة المستخلص. */
    amount: number;
    /** نسبة التنفيذ % (0–100). */
    executionPercent: number | null;
    /** النسبة المؤوية للصرف: calculated by the server (never sent). */
    paymentPercent: number | null;
    /** دفعة (a meta `installments` value). */
    installment: string | null;
    /** اجمالي الخامات = الحديد + الاسمنت (server, never sent). */
    materialsTotal: number | null;
    notes: string | null;
    /** موقف المستخلص: calculated by the server from the dates (never sent). */
    status: string;
    attachmentCount: number;
  };

export type StatementDto = StatementItem & { attachments: AttachmentDto[] };

export type StatementSortBy = "status" | "createdAt" | "updatedAt";

export type StatementFilters = {
  contractId?: string;
  status?: string;
  installment?: string;
};

export type StatementListParams = ListParams<StatementSortBy> & StatementFilters;

/** `/export`: same filters and sort, no paging. */
export type StatementExportParams = Omit<StatementListParams, "page" | "pageSize">;

export type StatementPage = PagedResult<StatementItem> & {
  totalAmount: number;
  totalNetPayment: number;
  /** The counter buttons: every status in journey order, for all filters except status. */
  statusCounts: { all: number; statuses: { status: string; count: number }[] };
};

/** Calculated or read-only fields are not sent. */
export type SaveStatementRequest = Omit<
  StatementItem,
  | keyof AuditFields
  | "id"
  | "contractNumber"
  | "contractName"
  | "projectName"
  | "companyName"
  | "companyCommercialRegister"
  | "contractValue"
  | "paymentPercent"
  | "materialsTotal"
  | "status"
  | "attachmentCount"
>;
