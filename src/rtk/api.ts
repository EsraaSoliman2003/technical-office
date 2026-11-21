import { createApi, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { AxiosRequestConfig } from "axios";
import http from "@/lib/axios";
import { getApiFailure, type ApiFailure } from "@/utils/apiFailure";

export interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig["method"];
  data?: AxiosRequestConfig["data"];
  params?: AxiosRequestConfig["params"];
  headers?: AxiosRequestConfig["headers"];
}

/** RTK Query base query on top of the shared axios instance. Errors are `ApiFailure`. */
export const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, unknown, ApiFailure> =>
  async ({ url, method = "GET", data, params, headers }) => {
    try {
      const response = await http.request({ url, method, data, params, headers });
      return { data: response.data };
    } catch (error) {
      return { error: getApiFailure(error) };
    }
  };

/**
 * Base API. Feature tasks add endpoints with `api.injectEndpoints(...)` and
 * register their cache tags with `api.enhanceEndpoints({ addTagTypes: [...] })`.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: [],
  endpoints: () => ({}),
});
