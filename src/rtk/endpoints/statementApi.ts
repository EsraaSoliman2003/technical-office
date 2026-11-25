import type {
  SaveStatementRequest,
  StatementDto,
  StatementExportParams,
  StatementItem,
  StatementListParams,
  StatementMeta,
  StatementPage,
} from "@/types/statement";
import { api } from "../api";
import { cleanParams } from "../queryParams";
import { companyListTag } from "./companyApi";
import { contractListTag } from "./contractApi";
import { projectListTag } from "./projectApi";

const RESOURCE = "statements";
const listTag = { type: "Statement" as const, id: "LIST" };
const itemTag = (id: string) => ({ type: "Statement" as const, id });
/** Every contract's statements table (a statement can move to another contract, so all of them refresh). */
const contractListsTag = { type: "Statement" as const, id: "CONTRACT_LISTS" };
/** Rows show contract, project and company names / values: refetch when one of those changes. */
const nameTags = [contractListTag, projectListTag, companyListTag];
/**
 * A statement saved / deleted: the statements (both screens) and the contracts list (statement
 * counts, totals and the موقف المستخلص counters).
 */
const changeTags = (id?: string) => [listTag, contractListsTag, contractListTag, ...(id ? [itemTag(id)] : [])];

/** المستخلصات (`/api/statements`): list with totals and status counts, export, meta, CRUD, attachments. */
export const statementApi = api
  .enhanceEndpoints({ addTagTypes: ["Statement", "Contract", "Project", "Company"] })
  .injectEndpoints({
    endpoints: (build) => ({
      listStatements: build.query<StatementPage, StatementListParams>({
        query: (params) => ({ url: RESOURCE, params: cleanParams(params) }),
        providesTags: (result) => [listTag, ...nameTags, ...(result?.items ?? []).map((item) => itemTag(item.id))],
      }),

      /** All rows for the current filters and sort (max 5000, else 400). Fetch it unsubscribed. */
      exportStatements: build.query<StatementItem[], StatementExportParams>({
        query: (params) => ({ url: `${RESOURCE}/export`, params: cleanParams(params) }),
        keepUnusedDataFor: 0,
      }),

      /** Statuses and دفعة values with their Arabic labels, in order. */
      statementMeta: build.query<StatementMeta, void>({
        query: () => ({ url: `${RESOURCE}/meta` }),
        keepUnusedDataFor: 3600,
      }),

      /** The statements of one contract (the contract dialog's table). */
      listContractStatements: build.query<StatementItem[], string>({
        query: (contractId) => ({ url: `contracts/${contractId}/statements` }),
        providesTags: (result) => [contractListsTag, ...nameTags, ...(result ?? []).map((item) => itemTag(item.id))],
      }),

      getStatement: build.query<StatementDto, string>({
        query: (id) => ({ url: `${RESOURCE}/${id}` }),
        providesTags: (_result, _error, id) => [itemTag(id), ...nameTags],
      }),

      createStatement: build.mutation<StatementDto, SaveStatementRequest>({
        query: (body) => ({ url: RESOURCE, method: "POST", data: body }),
        invalidatesTags: (_result, error) => (error ? [] : changeTags()),
      }),

      updateStatement: build.mutation<StatementDto, { id: string; body: SaveStatementRequest }>({
        query: ({ id, body }) => ({ url: `${RESOURCE}/${id}`, method: "PUT", data: body }),
        invalidatesTags: (_result, error, { id }) => (error ? [] : changeTags(id)),
      }),

      removeStatement: build.mutation<void, string>({
        query: (id) => ({ url: `${RESOURCE}/${id}`, method: "DELETE" }),
        invalidatesTags: (_result, error, id) => (error ? [] : changeTags(id)),
      }),

      removeStatementAttachment: build.mutation<void, { id: string; attachmentId: string }>({
        query: ({ id, attachmentId }) => ({ url: `${RESOURCE}/${id}/attachments/${attachmentId}`, method: "DELETE" }),
        // Both tables show the attachment count, the statement holds the attachments.
        invalidatesTags: (_result, error, { id }) => (error ? [] : [listTag, contractListsTag, itemTag(id)]),
      }),
    }),
  });

export const {
  useListStatementsQuery,
  useStatementMetaQuery,
  useListContractStatementsQuery,
  useGetStatementQuery,
  useCreateStatementMutation,
  useUpdateStatementMutation,
  useRemoveStatementMutation,
  useRemoveStatementAttachmentMutation,
} = statementApi;

/** Cache tags to invalidate after uploading attachments to a statement (or when it is gone: 404). */
export const statementAttachmentTags = (id: string) => [listTag, contractListsTag, itemTag(id)];

/** Attachments endpoint of a statement (upload: POST `files`; one file: `${url}/{attachmentId}`). */
export const statementAttachmentsUrl = (id: string) => `${RESOURCE}/${id}/attachments`;
