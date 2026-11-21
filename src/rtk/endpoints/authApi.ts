import type { LoginRequest, LoginResponse, MeResponse } from "@/utils/dtos";
import { api } from "../api";

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: "auth/login", method: "POST", data: body }),
    }),
    me: build.query<MeResponse, void>({
      query: () => ({ url: "auth/me" }),
    }),
  }),
});

export const { useLoginMutation, useMeQuery } = authApi;
