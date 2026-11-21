"use client";

import {
  SubmitHandler,
  UseFormReturn,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { setCookie } from "cookies-next";

import {
  useAppDispatch,
  useAppSelector,
} from "@/rtk/hooks";

import { loginUser } from "@/rtk/slices/authSlice";
import type { ApiFailure } from "@/utils/apiFailure";

import {
  getLoginSchema,
  LoginSchemaType,
} from "@/validation/loginSchema";

interface UseLoginFormReturn
  extends Pick<
    UseFormReturn<LoginSchemaType>,
    | "register"
    | "handleSubmit"
    | "control"
    | "formState"
    | "setValue"
    | "trigger"
  > {
  onSubmit: SubmitHandler<LoginSchemaType>;
  loading: boolean;
  requestError: string | null;
}

export const useLoginForm = (): UseLoginFormReturn => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const loading = useAppSelector(
    (state) => state.auth.loading
  );
  const [requestError, setRequestError] = useState<string | null>(null);

  const loginSchema = getLoginSchema();

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<LoginSchemaType> = async (
    data
  ) => {
    setRequestError(null);
    form.clearErrors();
    try {
      const resultAction = await dispatch(
        loginUser({
          login: data.login.trim(),
          password: data.password,
        })
      );

      if (loginUser.rejected.match(resultAction)) {
        const failure: ApiFailure | undefined = resultAction.payload;
        if (!failure) {
          setRequestError("Unexpected error");
          return;
        }

        const unassignedErrors: string[] = [];
        Object.entries(failure.fieldErrors).forEach(([field, messages]) => {
          const message = messages.join(" ");
          if (field === "login" || field === "password") {
            form.setError(field, { type: "server", message });
          } else {
            unassignedErrors.push(`${field}: ${message}`);
          }
        });

        const globalMessage = failure.networkError
          ? "Network error"
          : [failure.message, ...unassignedErrors].filter(Boolean).join("\n");
        setRequestError(
          globalMessage ||
            (Object.keys(failure.fieldErrors).length === 0
              ? "Unexpected error"
              : null)
        );
        return;
      }

      const { token } = resultAction.payload.data;

      setCookie("token", token, {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      toast.success("Logged in successfully");

      router.replace("/");
    } catch {
      setRequestError("Unexpected error");
    }
  };

  return {
    register: form.register,
    handleSubmit: form.handleSubmit,
    control: form.control,
    formState: form.formState,
    setValue: form.setValue,
    trigger: form.trigger,
    onSubmit,
    loading,
    requestError,
  };
};