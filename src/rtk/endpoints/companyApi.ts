import type { AxiosProgressEvent } from "axios";
import { isAxiosError } from "axios";
import http from "@/lib/axios";
import type { AttachmentDto, CompanyDto, CompanyInput, CompanyListItemDto, CompanyListParams } from "@/types/company";
import type { PagedResult } from "@/types/paged";
import { getApiFailure, parseProblemDetails, UNEXPECTED_ERROR_MESSAGE, type ApiFailure } from "@/utils/apiFailure";
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

/**
 * Uploads files in one multipart request (field `files`). Done with axios directly (not an RTK
 * mutation) so upload progress can be reported; invalidate `companyAttachmentTags` afterwards.
 * Throws an `ApiFailure`.
 */
export async function uploadCompanyAttachments(
  companyId: string,
  files: File[],
  onProgress?: (percent: number | null) => void
): Promise<AttachmentDto[]> {
  const data = new FormData();
  for (const file of files) data.append("files", file, file.name);
  try {
    const response = await http.post<AttachmentDto[]>(`${RESOURCE}/${companyId}/attachments`, data, {
      // Lets axios send the FormData as-is (the browser sets the boundary).
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event: AxiosProgressEvent) =>
        onProgress?.(event.total ? Math.round((event.loaded * 100) / event.total) : null),
    });
    return response.data;
  } catch (error) {
    throw getApiFailure(error);
  }
}

/**
 * Downloads an attachment as a Blob with the Bearer token (files are never linked to directly).
 * Throws an `ApiFailure` (the ProblemDetails body of an error arrives as a Blob too).
 */
export async function fetchCompanyAttachment(companyId: string, attachmentId: string): Promise<Blob> {
  try {
    const response = await http.get<Blob>(`${RESOURCE}/${companyId}/attachments/${attachmentId}`, {
      responseType: "blob",
      headers: { Accept: "*/*" },
    });
    return response.data;
  } catch (error) {
    throw await blobErrorToFailure(error);
  }
}

async function blobErrorToFailure(error: unknown): Promise<ApiFailure> {
  const failure = getApiFailure(error);
  const body = isAxiosError(error) ? error.response?.data : undefined;
  if (!(body instanceof Blob)) return failure;
  try {
    const parsed = parseProblemDetails(JSON.parse(await body.text()), failure.status);
    return parsed.message || Object.keys(parsed.fieldErrors).length > 0
      ? parsed
      : { ...parsed, message: UNEXPECTED_ERROR_MESSAGE };
  } catch {
    return failure;
  }
}
