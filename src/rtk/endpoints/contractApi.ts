import type {
  ContractDto,
  ContractExportParams,
  ContractItem,
  ContractListParams,
  ContractMeta,
  ContractPage,
  ContractPaperDto,
  SaveContractPaperRequest,
  SaveContractRequest,
} from "@/types/contract";
import type { NamedOption } from "@/types/options";
import { api } from "../api";
import { cleanParams } from "../queryParams";
import { companyListTag } from "./companyApi";
import { lookupChangedTag } from "./lookupApi";
import { projectListTag } from "./projectApi";

const RESOURCE = "contracts";
const listTag = { type: "Contract" as const, id: "LIST" };
const itemTag = (id: string) => ({ type: "Contract" as const, id });
/** The papers of one contract. */
const papersTag = (contractId: string) => ({ type: "ContractPaper" as const, id: contractId });
/** Saving / deleting a paper changes the papers and the contract's paper counts (list and detail). */
const paperChangeTags = (contractId: string) => [papersTag(contractId), listTag, itemTag(contractId)];
/** Rows show project, company and project-type names: refetch when one of those is renamed. */
const nameTags = [projectListTag, companyListTag, lookupChangedTag("project-types")];

/** العقود (`/api/contracts`): list with totals and status counts, export, meta, CRUD, attachments per category. */
export const contractApi = api
  .enhanceEndpoints({ addTagTypes: ["Contract", "ContractPaper", "Project", "Company", "Lookup"] })
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

      /** `{ id, name }` of all contracts (name = "رقم العقد — اسم العقد"), e.g. for المستخلصات. */
      contractOptions: build.query<NamedOption[], void>({
        query: () => ({ url: `${RESOURCE}/options` }),
        providesTags: [listTag],
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

      // ---- الأوراق المستلمة (`/api/contracts/{contractId}/papers`) ----
      listContractPapers: build.query<ContractPaperDto[], string>({
        query: (contractId) => ({ url: contractPapersUrl(contractId) }),
        providesTags: (_result, _error, contractId) => [papersTag(contractId)],
      }),

      createContractPaper: build.mutation<ContractPaperDto, { contractId: string; body: SaveContractPaperRequest }>({
        query: ({ contractId, body }) => ({ url: contractPapersUrl(contractId), method: "POST", data: body }),
        invalidatesTags: (_result, error, { contractId }) => (error ? [] : paperChangeTags(contractId)),
      }),

      updateContractPaper: build.mutation<
        ContractPaperDto,
        { contractId: string; paperId: string; body: SaveContractPaperRequest }
      >({
        query: ({ contractId, paperId, body }) => ({
          url: `${contractPapersUrl(contractId)}/${paperId}`,
          method: "PUT",
          data: body,
        }),
        invalidatesTags: (_result, error, { contractId }) => (error ? [] : paperChangeTags(contractId)),
      }),

      removeContractPaper: build.mutation<void, { contractId: string; paperId: string }>({
        query: ({ contractId, paperId }) => ({ url: `${contractPapersUrl(contractId)}/${paperId}`, method: "DELETE" }),
        invalidatesTags: (_result, error, { contractId }) => (error ? [] : paperChangeTags(contractId)),
      }),

      removeContractPaperAttachment: build.mutation<
        void,
        { contractId: string; paperId: string; attachmentId: string }
      >({
        query: ({ contractId, paperId, attachmentId }) => ({
          url: `${contractPaperAttachmentsUrl(contractId, paperId)}/${attachmentId}`,
          method: "DELETE",
        }),
        // Only the papers table shows attachment counts.
        invalidatesTags: (_result, error, { contractId }) => (error ? [] : [papersTag(contractId)]),
      }),
    }),
  });

export const {
  useListContractsQuery,
  useContractMetaQuery,
  useContractOptionsQuery,
  useGetContractQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useRemoveContractMutation,
  useRemoveContractAttachmentMutation,
  useListContractPapersQuery,
  useCreateContractPaperMutation,
  useUpdateContractPaperMutation,
  useRemoveContractPaperMutation,
  useRemoveContractPaperAttachmentMutation,
} = contractApi;

/** Cache tags to invalidate after uploading attachments to a contract. */
export const contractAttachmentTags = (id: string) => [listTag, itemTag(id)];

/** Attachments endpoint of a contract (upload: POST with `?category=`; one file: `${url}/{attachmentId}`). */
export const contractAttachmentsUrl = (id: string) => `${RESOURCE}/${id}/attachments`;

/** The contracts list (and options): other resources invalidate it when the contract counts change. */
export const contractListTag = listTag;

/** One contract's detail (e.g. its قيمة السلفة / موقف السلفة change when its advance sheet is saved). */
export const contractItemTag = itemTag;

/** The papers endpoint of a contract (one paper: `${url}/{paperId}`). */
export const contractPapersUrl = (contractId: string) => `${RESOURCE}/${contractId}/papers`;

/** Attachments endpoint of a paper (upload: POST `files`; one file: `${url}/{attachmentId}`). */
export const contractPaperAttachmentsUrl = (contractId: string, paperId: string) =>
  `${contractPapersUrl(contractId)}/${paperId}/attachments`;

/** Cache tags to invalidate when a contract's papers changed (also its paper counts). */
export const contractPaperChangeTags = paperChangeTags;

/** Cache tags to invalidate after uploading attachments to a paper. */
export const contractPaperAttachmentTags = (contractId: string) => [papersTag(contractId)];
