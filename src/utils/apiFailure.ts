import { isAxiosError } from "axios";

export const NETWORK_ERROR_MESSAGE = "تعذر الاتصال بالخادم";
export const UNEXPECTED_ERROR_MESSAGE = "حدث خطأ غير متوقع";

export interface ApiFailure {
  /** `detail || title` from the ProblemDetails body (already in Arabic). */
  message: string;
  /** ProblemDetails `errors`, keys as-is (camelCase). */
  fieldErrors: Record<string, string[]>;
  /** True when the server could not be reached (no response). */
  networkError: boolean;
  /** HTTP status, or null when there was no response. */
  status: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toMessages(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

/** Parses an RFC 7807 ProblemDetails body. */
export function parseProblemDetails(data: unknown, status: number | null = null): ApiFailure {
  const failure: ApiFailure = { message: "", fieldErrors: {}, networkError: false, status };
  if (!isRecord(data)) return failure;

  const detail = typeof data.detail === "string" ? data.detail : "";
  const title = typeof data.title === "string" ? data.title : "";
  failure.message = detail || title;

  if (failure.status === null && typeof data.status === "number") {
    failure.status = data.status;
  }

  if (isRecord(data.errors)) {
    for (const [key, value] of Object.entries(data.errors)) {
      const messages = toMessages(value);
      if (messages.length > 0) failure.fieldErrors[key] = messages;
    }
  }

  return failure;
}

export function getApiFailure(error: unknown): ApiFailure {
  if (isAxiosError(error)) {
    if (!error.response) {
      return { message: NETWORK_ERROR_MESSAGE, fieldErrors: {}, networkError: true, status: null };
    }
    const failure = parseProblemDetails(error.response.data, error.response.status);
    if (!failure.message && Object.keys(failure.fieldErrors).length === 0) {
      failure.message = UNEXPECTED_ERROR_MESSAGE;
    }
    return failure;
  }

  return { message: UNEXPECTED_ERROR_MESSAGE, fieldErrors: {}, networkError: false, status: null };
}

/** A single message for toasts / form-level alerts. */
export function getFailureMessage(failure: ApiFailure | null | undefined): string {
  if (!failure) return UNEXPECTED_ERROR_MESSAGE;
  if (failure.networkError) return NETWORK_ERROR_MESSAGE;
  return failure.message || Object.values(failure.fieldErrors).flat()[0] || UNEXPECTED_ERROR_MESSAGE;
}
