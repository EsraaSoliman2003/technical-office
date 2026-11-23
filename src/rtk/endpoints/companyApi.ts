import type { CompanyDto, CompanyInput, CompanyListItemDto, CompanyListParams } from "@/types/company";
import type { PagedResult } from "@/types/paged";
import { api } from "../api";

const RESOURCE = "companies";
const listTag = { type: "Company" as const, id: "LIST" };
const itemTag = (id: string) => ({ type: "Company" as const, id });

/** Companies (`/api/companies`) and their attachments. */
export const companyApi = api.enhanceEndpoints({ addTagTypes: ["Company"] }).injectEndpoints({
  endpoints: (build) => ({
    listCompanies: build.query<PagedResult<CompanyListItemDto>, CompanyListParams>({
      query: ({ search, ...params }) => ({
        url: RESOURCE,
        params: { ...params, ...(search ? { search } : {}) },
      }),
      providesTags: (result) => [listTag, ...(result?.items ?? []).map((item) => itemTag(item.id))],
    }),

    getCompany: build.query<CompanyDto, string>({
      query: (id) => ({ url: `${RESOURCE}/${id}` }),
      providesTags: (_result, _error, id) => [itemTag(id)],
    }),

    createCompany: build.mutation<CompanyDto, CompanyInput>({
      query: (body) => ({ url: RESOURCE, method: "POST", data: body }),
      invalidatesTags: (_result, error) => (error ? [] : [listTag]),
    }),

    updateCompany: build.mutation<CompanyDto, { id: string; body: CompanyInput }>({
      query: ({ id, body }) => ({ url: `${RESOURCE}/${id}`, method: "PUT", data: body }),
      invalidatesTags: (_result, error, { id }) => (error ? [] : [listTag, itemTag(id)]),
    }),

    removeCompany: build.mutation<void, string>({
      query: (id) => ({ url: `${RESOURCE}/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error, id) => (error ? [] : [listTag, itemTag(id)]),
    }),

    removeCompanyAttachment: build.mutation<void, { companyId: string; attachmentId: string }>({
      query: ({ companyId, attachmentId }) => ({
        url: `${RESOURCE}/${companyId}/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      // The list shows the attachment count, the company holds the attachments.
      invalidatesTags: (_result, error, { companyId }) => (error ? [] : [listTag, itemTag(companyId)]),
    }),
  }),
});

export const {
  useListCompaniesQuery,
  useGetCompanyQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useRemoveCompanyMutation,
  useRemoveCompanyAttachmentMutation,
} = companyApi;

/** Cache tags to invalidate after uploading attachments to a company. */
export const companyAttachmentTags = (companyId: string) => [listTag, itemTag(companyId)];

/** Attachments endpoint of a company (upload: POST; one file: `${url}/{attachmentId}`). */
export const companyAttachmentsUrl = (companyId: string) => `${RESOURCE}/${companyId}/attachments`;
