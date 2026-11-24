import type {
  CompanyMaterialDto,
  CompanyMaterialExportParams,
  CompanyMaterialItem,
  CompanyMaterialListParams,
  CompanyMaterialPage,
  SaveCompanyMaterialRequest,
} from "@/types/companyMaterial";
import { api } from "../api";
import { companyListTag } from "./companyApi";
import { lookupChangedTag } from "./lookupApi";
import { projectListTag } from "./projectApi";

const RESOURCE = "company-materials";
const listTag = { type: "CompanyMaterial" as const, id: "LIST" };
const itemTag = (id: string) => ({ type: "CompanyMaterial" as const, id });
/** Rows show project, material and company names: refetch when one of those is renamed. */
const nameTags = [projectListTag, companyListTag, lookupChangedTag("materials")];

/** Query string without empty values (`search=""`, a cleared filter). */
function cleanParams(params: Record<string, string | number | undefined>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));
}

/** خامات الشركات (`/api/company-materials`): list with total quantity, export, CRUD, attachments (البوليصة). */
export const companyMaterialApi = api
  .enhanceEndpoints({ addTagTypes: ["CompanyMaterial", "Project", "Company", "Lookup"] })
  .injectEndpoints({
    endpoints: (build) => ({
      listCompanyMaterials: build.query<CompanyMaterialPage, CompanyMaterialListParams>({
        query: (params) => ({ url: RESOURCE, params: cleanParams(params) }),
        providesTags: (result) => [
          listTag,
          ...nameTags,
          ...(result?.items ?? []).map((item) => itemTag(item.id)),
        ],
      }),

      /** All rows for the current filters and sort (max 5000, else 400). Not cached for long. */
      exportCompanyMaterials: build.query<CompanyMaterialItem[], CompanyMaterialExportParams>({
        query: (params) => ({ url: `${RESOURCE}/export`, params: cleanParams(params) }),
        keepUnusedDataFor: 0,
      }),

      getCompanyMaterial: build.query<CompanyMaterialDto, string>({
        query: (id) => ({ url: `${RESOURCE}/${id}` }),
        providesTags: (_result, _error, id) => [itemTag(id), ...nameTags],
      }),

      createCompanyMaterial: build.mutation<CompanyMaterialDto, SaveCompanyMaterialRequest>({
        query: (body) => ({ url: RESOURCE, method: "POST", data: body }),
        invalidatesTags: (_result, error) => (error ? [] : [listTag]),
      }),

      updateCompanyMaterial: build.mutation<CompanyMaterialDto, { id: string; body: SaveCompanyMaterialRequest }>({
        query: ({ id, body }) => ({ url: `${RESOURCE}/${id}`, method: "PUT", data: body }),
        invalidatesTags: (_result, error, { id }) => (error ? [] : [listTag, itemTag(id)]),
      }),

      removeCompanyMaterial: build.mutation<void, string>({
        query: (id) => ({ url: `${RESOURCE}/${id}`, method: "DELETE" }),
        invalidatesTags: (_result, error, id) => (error ? [] : [listTag, itemTag(id)]),
      }),

      removeCompanyMaterialAttachment: build.mutation<void, { id: string; attachmentId: string }>({
        query: ({ id, attachmentId }) => ({ url: `${RESOURCE}/${id}/attachments/${attachmentId}`, method: "DELETE" }),
        // The list shows the attachment count, the record holds the attachments.
        invalidatesTags: (_result, error, { id }) => (error ? [] : [listTag, itemTag(id)]),
      }),
    }),
  });

export const {
  useListCompanyMaterialsQuery,
  useLazyExportCompanyMaterialsQuery,
  useGetCompanyMaterialQuery,
  useCreateCompanyMaterialMutation,
  useUpdateCompanyMaterialMutation,
  useRemoveCompanyMaterialMutation,
  useRemoveCompanyMaterialAttachmentMutation,
} = companyMaterialApi;

/** Cache tags to invalidate after uploading attachments to a record. */
export const companyMaterialAttachmentTags = (id: string) => [listTag, itemTag(id)];

/** Attachments endpoint of a record (upload: POST; one file: `${url}/{attachmentId}`). */
export const companyMaterialAttachmentsUrl = (id: string) => `${RESOURCE}/${id}/attachments`;

/** Up to 5 files per record (البوليصة). */
export const MAX_COMPANY_MATERIAL_ATTACHMENTS = 5;
