"use client";

import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch } from "@/rtk/hooks";
import { logoutUser } from "@/rtk/slices/authSlice";
import type { ApiFailure } from "@/utils/apiFailure";

export const useLogout = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const logout = async () => {
    try {
      const result = await dispatch(logoutUser());
      if (logoutUser.rejected.match(result)) {
        const failure: ApiFailure | undefined = result.payload;
        const fieldMessages = failure
          ? Object.values(failure.fieldErrors).flat()
          : [];
        const message = failure?.networkError
          ? "Network error"
          : [failure?.message, ...fieldMessages].filter(Boolean).join("\n") ||
            "Unexpected error";
        toast.error(message);
      }
    } catch {
      toast.error("Unexpected error");
    } finally {
      deleteCookie("token");
      router.replace("/login");
    }
  };

  return logout;
};