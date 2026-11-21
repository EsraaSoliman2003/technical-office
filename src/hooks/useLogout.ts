"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/rtk/hooks";
import { logout } from "@/rtk/slices/authSlice";

/** Clears the session and the store, then goes to /login. */
export const useLogout = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  return useCallback(() => {
    dispatch(logout());
    router.replace("/login");
  }, [dispatch, router]);
};
