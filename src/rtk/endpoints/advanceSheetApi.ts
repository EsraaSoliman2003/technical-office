import type {
  AdvanceSheetExportParams,
  AdvanceSheetItem,
  AdvanceSheetListParams,
  AdvanceSheetMeta,
  AdvanceSheetPage,
  SaveAdvanceSheetRequest,
} from "@/types/advanceSheet";
import { api } from "../api";
import { cleanParams } from "../queryParams";
import { companyListTag } from "./companyApi";
import { contractItemTag, contractListTag } from "./contractApi";
import { projectListTag } from "./projectApi";

const RESOURCE = "advance-sheets";
const listTag = { type: "AdvanceSheet" as const, id: "LIST" };
const itemTag = (id: string) => ({ type: "AdvanceSheet" as const, id });
/** "Does this contract have a sheet?" lookups (all of them: a delete frees the contract again). */
const contractSheetsTag = { type: "AdvanceSheet" as const, id: "BY_CONTRACT" };
/** Rows show contract, project and company names / values: refetch when one of those changes. */
const nameTags = [contractListTag, projectListTag, companyListTag];
/**
 * A sheet saved / deleted: the sheets, and its contract (the server sets the contract's قيمة السلفة
 * and موقف السلفة from it), in the contracts list and the contract's detail.
 */
const changeTags = (contractId: string, id?: string) => [
  listTag,
  contractSheetsTag,
  contractListTag,
  contractItemTag(contractId),
  ...(id ? [itemTag(id)] : []),
];

/** السلف (`/api/advance-sheets`): حساب قيمة السلفة per contract — list with totals and counts, export, meta, CRUD. */
export const advanceSheetApi = api
  .enhanceEndpoints({ addTagTypes: ["AdvanceSheet", "Contract", "Project", "Company"] })
  .injectEndpoints({
    endpoints: (build) => ({
      listAdvanceSheets: build.query<AdvanceSheetPage, AdvanceSheetListParams>({
        query: (params) => ({ url: RESOURCE, params: cleanParams(params) }),
        providesTags: (result) => [listTag, ...nameTags, ...(result?.items ?? []).map((item) => itemTag(item.id))],
      }),

      /** All rows for the current filters and sort (max 5000, else 400). Fetch it unsubscribed. */
      exportAdvanceSheets: build.query<AdvanceSheetItem[], AdvanceSheetExportParams>({
        query: (params) => ({ url: `${RESOURCE}/export`, params: cleanParams(params) }),
        keepUnusedDataFor: 0,
      }),

      /** الاسعار values and the formula rates. */
      advanceSheetMeta: build.query<AdvanceSheetMeta, void>({
        query: () => ({ url: `${RESOURCE}/meta` }),
        keepUnusedDataFor: 3600,
      }),

      /** A contract's sheet; a 404 error = the contract has none yet. */
      getContractAdvanceSheet: build.query<AdvanceSheetItem, string>({
        query: (contractId) => ({ url: `contracts/${contractId}/advance-sheet` }),
        providesTags: (result) => [contractSheetsTag, ...(result ? [itemTag(result.id)] : [])],
      }),

      createAdvanceSheet: build.mutation<AdvanceSheetItem, SaveAdvanceSheetRequest>({
        query: (body) => ({ url: RESOURCE, method: "POST", data: body }),
        invalidatesTags: (_result, error, body) => (error ? [] : changeTags(body.contractId)),
      }),

      updateAdvanceSheet: build.mutation<AdvanceSheetItem, { id: string; body: SaveAdvanceSheetRequest }>({
        query: ({ id, body }) => ({ url: `${RESOURCE}/${id}`, method: "PUT", data: body }),
        invalidatesTags: (_result, error, { id, body }) => (error ? [] : changeTags(body.contractId, id)),
      }),

      removeAdvanceSheet: build.mutation<void, { id: string; contractId: string }>({
        query: ({ id }) => ({ url: `${RESOURCE}/${id}`, method: "DELETE" }),
        invalidatesTags: (_result, error, { id, contractId }) => (error ? [] : changeTags(contractId, id)),
      }),
    }),
  });

export const {
  useListAdvanceSheetsQuery,
  useAdvanceSheetMetaQuery,
  useGetContractAdvanceSheetQuery,
  useCreateAdvanceSheetMutation,
  useUpdateAdvanceSheetMutation,
  useRemoveAdvanceSheetMutation,
} = advanceSheetApi;

/** Cache tags to refresh when a sheet turned out to be gone (404). */
export const advanceSheetGoneTags = (contractId: string, id: string) => changeTags(contractId, id);
