"use client";

import { useCallback } from "react";
import { useAppDispatch } from "@/rtk/hooks";
import { logout } from "@/rtk/slices/authSlice";

/** The user logs out: clears the session and the store; `AuthGuard` then redirects to /login. */
export const useLogout = () => {
  const dispatch = useAppDispatch();
  return useCallback(() => dispatch(logout()), [dispatch]);
};
