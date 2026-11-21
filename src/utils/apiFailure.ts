import { isAxiosError } from "axios";

export interface ApiFailure {
  message: string;
  fieldErrors: Record<string, string[]>;
  networkError: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function messagesFrom(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    typeof item === "string" ? [item] : messagesFrom(item)
  );
}

export function parseApiFailure(data: unknown): ApiFailure {
  if (!isRecord(data)) {
    return { message: "", fieldErrors: {}, networkError: false };
  }

  const message = typeof data.message === "string" ? data.message : "";
  const fieldErrors: Record<string, string[]> = {};
  const errors = data.errors;

  if (Array.isArray(errors)) {
    errors.forEach((entry) => {
      if (!isRecord(entry) || typeof entry.key !== "string") return;
      const messages = messagesFrom(entry.value);
      if (messages.length > 0) {
        fieldErrors[entry.key] = [
          ...(fieldErrors[entry.key] || []),
          ...messages,
        ];
      }
    });
  } else if (isRecord(errors)) {
    Object.entries(errors).forEach(([key, value]) => {
      const messages = messagesFrom(value);
      if (messages.length > 0) fieldErrors[key] = messages;
    });
  }

  return { message, fieldErrors, networkError: false };
}

export function getApiFailure(error: unknown): ApiFailure {
  if (isAxiosError(error)) {
    if (!error.response) {
      return { message: "", fieldErrors: {}, networkError: true };
    }

    const failure = parseApiFailure(error.response.data);
    if (failure.message || Object.keys(failure.fieldErrors).length > 0) {
      return failure;
    }

    return {
      ...failure,
      message: error.response.statusText || "",
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      fieldErrors: {},
      networkError: false,
    };
  }

  return { message: "", fieldErrors: {}, networkError: false };
}
