import axios from "axios";
import { getToken } from "./session";

/** API origin, e.g. http://localhost:5133 (web) or a local-network IP (desktop). */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5133").replace(/\/+$/, "");

const LOGIN_PATH = "auth/login";

const instance = axios.create({
  baseURL: `${API_URL}/api/`,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * Registered by the auth layer (clears session + store and redirects to /login).
 * A callback keeps this module free of a Redux store import (avoids an import cycle).
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

instance.interceptors.request.use((config) => {
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
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export default instance;
