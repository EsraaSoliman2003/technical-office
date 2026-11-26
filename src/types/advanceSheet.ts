import type { ContractMetaItem } from "./contract";
import type { AuditFields, ListParams, PagedResult } from "./paged";

/** `/api/advance-sheets/meta`: الاسعار values, and the rates of the formulas (fractions, e.g. 0.5). */
export type AdvanceSheetMeta = {
  prices: ContractMetaItem[];
  rates: { contractAdvanceCapRate: number; onSiteRate: number };
};

/** Money inputs (2 decimals; null = empty). requestedAmount = السلفة (قيمة الدفعة المطلوب صرفها تحت الحساب). */
export const ADVANCE_SHEET_MONEY_FIELDS = [
  "statementsSpent",
  "advancesRemaining",
  "ironPrice",
  "cementPrice",
  "miscMaterialsValue",
  "requestedAmount",
] as const;
export type AdvanceSheetMoneyField = (typeof ADVANCE_SHEET_MONEY_FIELDS)[number];

/** Quantity inputs (3 decimals; null = empty). */
export const ADVANCE_SHEET_QUANTITY_FIELDS = ["ironQuantity", "cementQuantity"] as const;
export type AdvanceSheetQuantityField = (typeof ADVANCE_SHEET_QUANTITY_FIELDS)[number];

/** Values the server calculates (never sent); the form shows a live preview until saved. */
export const ADVANCE_SHEET_CALCULATED_FIELDS = [
  "maxByContract",
  "maxByProgress",
  "maxOnSite",
  "lowestMax",
  "materialsRemaining",
  "totalSpent",
  "totalSpentPercent",
  "maxAllowedRequest",
  "requestedPercent",
  "remainingInContract",
  "remainingPercent",
] as const;
export type AdvanceSheetCalculatedField = (typeof ADVANCE_SHEET_CALCULATED_FIELDS)[number];

/** The editable values (the save body). */
export type SaveAdvanceSheetRequest = Record<AdvanceSheetMoneyField, number | null> &
  Record<AdvanceSheetQuantityField, number | null> & {
    contractId: string;
    /** نسبة التنفيذ % (0–100). */
    executionPercent: number | null;
    /** تاريخ استلام الموقع ("yyyy-MM-dd"). */
    siteReceiptDate: string | null;
    /** الاسعار (a meta `prices` value). */
    prices: string | null;
    /** مدة التنفيذ (text). */
    executionDuration: string | null;
  };

/** A sheet from the API (list item and detail have the same shape). */
export type AdvanceSheetItem = AuditFields &
  SaveAdvanceSheetRequest &
  Record<AdvanceSheetCalculatedField, number | null> & {
    id: string;
    contractNumber: string;
    contractName: string;
    projectName: string;
    companyName: string;
    companyCommercialRegister: string | null;
    contractValue: number | null;
    /** The contract's موقف السلفة (contracts meta `advanceStatuses`). */
    advanceStatus: string;
    /** The requested amount is above الحد الاقصى المسموح (server). */
    exceedsAllowed: boolean;
  };

export type AdvanceSheetSortBy = "contractNumber" | "requestedAmount" | "advanceStatus" | "createdAt" | "updatedAt";

export type AdvanceSheetFilters = { advanceStatus?: string };

export type AdvanceSheetListParams = ListParams<AdvanceSheetSortBy> & AdvanceSheetFilters;

/** `/export`: same filters and sort, no paging. */
export type AdvanceSheetExportParams = Omit<AdvanceSheetListParams, "page" | "pageSize">;

export type AdvanceSheetPage = PagedResult<AdvanceSheetItem> & {
  /** إجمالي السلف. */
  totalRequested: number;
  /** The موقف السلفة counter buttons, for all filters except advanceStatus. */
  statusCounts: { all: number; statuses: { status: string; count: number }[] };
};
