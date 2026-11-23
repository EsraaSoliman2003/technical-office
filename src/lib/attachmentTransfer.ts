import { isAxiosError, type AxiosProgressEvent } from "axios";
import type { AttachmentDto } from "@/types/attachment";
import { getApiFailure, parseProblemDetails, UNEXPECTED_ERROR_MESSAGE, type ApiFailure } from "@/utils/apiFailure";
import http from "./axios";

/**
 * Uploads files in one multipart request (field `files`) to an attachments endpoint, e.g.
 * `companies/{id}/attachments`. Done with axios directly (not an RTK mutation) so upload progress
 * can be reported; the caller invalidates its cache tags afterwards. Throws an `ApiFailure`.
 */
export async function uploadAttachments(
  url: string,
  files: File[],
  options: { params?: Record<string, string>; onProgress?: (percent: number | null) => void } = {}
): Promise<AttachmentDto[]> {
  const data = new FormData();
  for (const file of files) data.append("files", file, file.name);
  try {
    const response = await http.post<AttachmentDto[]>(url, data, {
      params: options.params,
      // Lets axios send the FormData as-is (the browser sets the boundary).
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event: AxiosProgressEvent) =>
        options.onProgress?.(event.total ? Math.round((event.loaded * 100) / event.total) : null),
    });
    return response.data;
  } catch (error) {
    throw getApiFailure(error);
  }
}

/**
 * Downloads a protected file as a Blob with the Bearer token (files are never linked to directly).
 * Throws an `ApiFailure` (the ProblemDetails body of an error arrives as a Blob too).
 */
export async function fetchAttachmentBlob(url: string): Promise<Blob> {
  try {
    const response = await http.get<Blob>(url, { responseType: "blob", headers: { Accept: "*/*" } });
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
