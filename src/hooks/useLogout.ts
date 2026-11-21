"use client";

import { useCallback } from "react";
import { useAppDispatch } from "@/rtk/hooks";
import { logout } from "@/rtk/slices/authSlice";

/**
 * Clears the session and the store. `AuthGuard` then redirects to /login
 * (with `?returnTo=` unless the user logged out on purpose).
 */
export const useLogout = () => {
  const dispatch = useAppDispatch();

  return useCallback(
    ({ byUser = true }: { byUser?: boolean } = {}) => {
      dispatch(logout({ byUser }));
    },
    [dispatch]
  );
};
