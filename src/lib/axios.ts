import axios from "axios";
import { loadApiUrl } from "./config";
import { getToken } from "./session";

const LOGIN_PATH = "auth/login";

// baseURL is set per request once the runtime config is loaded (see the request interceptor).
const instance = axios.create({
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/** Receives the token the rejected request was sent with (null if it had none). */
type UnauthorizedHandler = (rejectedToken: string | null) => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

function bearerTokenOf(headers: unknown): string | null {
  const value =
    headers && typeof headers === "object" ? (headers as Record<string, unknown>)["Authorization"] : undefined;
  return typeof value === "string" && value.startsWith("Bearer ") ? value.slice("Bearer ".length) : null;
}

/**
 * Registered by the auth layer (ends the session; the guards redirect to /login).
 * A callback keeps this module free of a Redux store import (avoids an import cycle).
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

instance.interceptors.request.use(async (config) => {
  // Waits for /config.json before the first API call (fetched only once).
  config.baseURL = `${await loadApiUrl()}/api/`;
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error?.response?.status;
    const url: string = error?.config?.url ?? "";
    const isLogin = url.replace(/^\/+/, "").startsWith(LOGIN_PATH);
    if (status === 401 && !isLogin) {
      unauthorizedHandler?.(bearerTokenOf(error?.config?.headers));
    }
    return Promise.reject(error);
  }
);

export default instance;
