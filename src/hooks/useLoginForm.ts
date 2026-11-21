"use client";

import { useState } from "react";
import { useForm, type SubmitHandler, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { saveSession, type Session } from "@/lib/session";
import { useAppDispatch } from "@/rtk/hooks";
import { useLoginMutation } from "@/rtk/endpoints/authApi";
import { sessionStarted } from "@/rtk/slices/authSlice";
import { getFailureMessage, UNEXPECTED_ERROR_MESSAGE, type ApiFailure } from "@/utils/apiFailure";
import { getLoginSchema, type LoginSchemaType } from "@/validation/loginSchema";

const FORM_FIELDS = ["email", "password"] as const;
type FormField = (typeof FORM_FIELDS)[number];

function isFormField(key: string): key is FormField {
  return (FORM_FIELDS as readonly string[]).includes(key);
}

interface UseLoginFormReturn extends Pick<UseFormReturn<LoginSchemaType>, "register" | "handleSubmit" | "formState"> {
  onSubmit: SubmitHandler<LoginSchemaType>;
  loading: boolean;
  requestError: string | null;
}

export const useLoginForm = (): UseLoginFormReturn => {
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [requestError, setRequestError] = useState<string | null>(null);

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(getLoginSchema()),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit: SubmitHandler<LoginSchemaType> = async (data) => {
    setRequestError(null);
    form.clearErrors();

    const result = await login({ email: data.email, password: data.password });

    if ("error" in result) {
      const failure = result.error as ApiFailure | undefined;
      if (!failure) {
        setRequestError(UNEXPECTED_ERROR_MESSAGE);
        return;
      }

      // Field errors go under their inputs (keys are camelCase, same as the form).
      const otherErrors: string[] = [];
      for (const [key, messages] of Object.entries(failure.fieldErrors)) {
        if (isFormField(key)) {
          form.setError(key, { type: "server", message: messages.join(" ") });
        } else {
          otherErrors.push(...messages);
        }
      }

      const hasFieldErrors = Object.keys(failure.fieldErrors).some(isFormField);
      // For validation errors the title is generic; show it only if nothing went under a field.
      const general = hasFieldErrors && failure.status === 400 ? otherErrors : [getFailureMessage(failure), ...otherErrors];
      const message = [...new Set(general.filter(Boolean))].join("\n");
      setRequestError(message || null);
      return;
    }

    const { accessToken, expiresAt, userId, fullName, email, role } = result.data;
    const session: Session = { accessToken, expiresAt, userId, fullName, email, role };
    saveSession(session);
    dispatch(sessionStarted(session));
    toast.success("تم تسجيل الدخول بنجاح");
    // GuestGuard now redirects to ?returnTo= (validated) or home.
  };

  return {
    register: form.register,
    handleSubmit: form.handleSubmit,
    formState: form.formState,
    onSubmit,
    loading: isLoading,
    requestError,
  };
};
