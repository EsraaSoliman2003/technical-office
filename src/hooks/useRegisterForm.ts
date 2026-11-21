"use client";

import {
  useForm,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

import {
  useAppDispatch,
  useAppSelector,
} from "@/rtk/hooks";

import {
  getRegisterSchema,
  RegisterSchemaType,
} from "@/validation/registerSchema";

import { registerUser } from "@/rtk/slices/authSlice";
import type { ApiFailure } from "@/utils/apiFailure";

interface UseRegisterFormReturn
  extends Pick<
    UseFormReturn<RegisterSchemaType>,
    | "register"
    | "handleSubmit"
    | "control"
    | "formState"
    | "setValue"
    | "trigger"
  > {
  onSubmit: SubmitHandler<RegisterSchemaType>;
  loading: boolean;
  requestError: string | null;
}

export const useRegisterForm =
  (): UseRegisterFormReturn => {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const loading = useAppSelector(
      (state) => state.auth.loading
    );
    const [requestError, setRequestError] = useState<string | null>(null);

    const registerSchema = getRegisterSchema();

    const form = useForm<RegisterSchemaType>({
      resolver: zodResolver(registerSchema),
      mode: "onChange",
      defaultValues: {
        name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
      },
    });
    const { setError, clearErrors } = form;

    const onSubmit: SubmitHandler<
      RegisterSchemaType
    > = async (data) => {
      setRequestError(null);
      clearErrors();
      try {
        const resultAction = await dispatch(
          registerUser({
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: data.password,
            // platform: "Website",
          })
        );

        if (registerUser.rejected.match(resultAction)) {
          const failure: ApiFailure | undefined = resultAction.payload;
          if (!failure) {
            setRequestError("Unexpected error");
            return;
          }

          const unassignedErrors: string[] = [];
          Object.entries(failure.fieldErrors).forEach(([field, messages]) => {
            const message = messages.join(" ");
            switch (field) {
              case "name":
              case "email":
              case "phone":
              case "password":
              case "password_confirmation":
                setError(field, { type: "server", message });
                break;
              default:
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

        toast.success("Account created successfully");

        const identifier = data.email || data.phone;

        router.push(
          `/verify-otp-Register?identifier=${encodeURIComponent(identifier)}`
        );
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