import type {
  ContractDto,
  ContractExportParams,
  ContractItem,
  ContractListParams,
  ContractMeta,
  ContractPage,
  SaveContractRequest,
} from "@/types/contract";
import { api } from "../api";
import { cleanParams } from "../queryParams";
import { companyListTag } from "./companyApi";
import { lookupChangedTag } from "./lookupApi";
import { projectListTag } from "./projectApi";

const RESOURCE = "contracts";
const listTag = { type: "Contract" as const, id: "LIST" };
const itemTag = (id: string) => ({ type: "Contract" as const, id });
/** Rows show project, company and project-type names: refetch when one of those is renamed. */
const nameTags = [projectListTag, companyListTag, lookupChangedTag("project-types")];

/** العقود (`/api/contracts`): list with totals and status counts, export, meta, CRUD, attachments per category. */
export const contractApi = api
  .enhanceEndpoints({ addTagTypes: ["Contract", "Project", "Company", "Lookup"] })
  .injectEndpoints({
    endpoints: (build) => ({
      listContracts: build.query<ContractPage, ContractListParams>({
        query: (params) => ({ url: RESOURCE, params: cleanParams(params) }),
        providesTags: (result) => [listTag, ...nameTags, ...(result?.items ?? []).map((item) => itemTag(item.id))],
      }),

      /** All rows for the current filters and sort (max 5000, else 400). Fetch it unsubscribed. */
      exportContracts: build.query<ContractItem[], ContractExportParams>({
        query: (params) => ({ url: `${RESOURCE}/export`, params: cleanParams(params) }),
        keepUnusedDataFor: 0,
      }),

      /** Stages and statuses with their Arabic labels, in order. */
      contractMeta: build.query<ContractMeta, void>({
        query: () => ({ url: `${RESOURCE}/meta` }),
        keepUnusedDataFor: 3600,
      }),

      getContract: build.query<ContractDto, string>({
        query: (id) => ({ url: `${RESOURCE}/${id}` }),
        providesTags: (_result, _error, id) => [itemTag(id), ...nameTags],
      }),

      createContract: build.mutation<ContractDto, SaveContractRequest>({
        query: (body) => ({ url: RESOURCE, method: "POST", data: body }),
        invalidatesTags: (_result, error) => (error ? [] : [listTag]),
      }),

      updateContract: build.mutation<ContractDto, { id: string; body: SaveContractRequest }>({
        query: ({ id, body }) => ({ url: `${RESOURCE}/${id}`, method: "PUT", data: body }),
        invalidatesTags: (_result, error, { id }) => (error ? [] : [listTag, itemTag(id)]),
      }),

      removeContract: build.mutation<void, string>({
        query: (id) => ({ url: `${RESOURCE}/${id}`, method: "DELETE" }),
        invalidatesTags: (_result, error, id) => (error ? [] : [listTag, itemTag(id)]),
      }),

      removeContractAttachment: build.mutation<void, { id: string; attachmentId: string }>({
        query: ({ id, attachmentId }) => ({ url: `${RESOURCE}/${id}/attachments/${attachmentId}`, method: "DELETE" }),
        // The list shows the counts per category, the contract holds the attachments.
        invalidatesTags: (_result, error, { id }) => (error ? [] : [listTag, itemTag(id)]),
      }),
    }),
  });

export const {
  useListContractsQuery,
  useContractMetaQuery,
  useGetContractQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useRemoveContractMutation,
  useRemoveContractAttachmentMutation,
} = contractApi;

/** Cache tags to invalidate after uploading attachments to a contract. */
export const contractAttachmentTags = (id: string) => [listTag, itemTag(id)];

/** Attachments endpoint of a contract (upload: POST with `?category=`; one file: `${url}/{attachmentId}`). */
export const contractAttachmentsUrl = (id: string) => `${RESOURCE}/${id}/attachments`;
