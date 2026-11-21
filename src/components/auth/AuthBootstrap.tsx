"use client";

import { useEffect, type ReactNode } from "react";
import { setUnauthorizedHandler } from "@/lib/axios";
import { getTokenExpiry, loadSession } from "@/lib/session";
import { useLogout } from "@/hooks/useLogout";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { sessionRestored } from "@/rtk/slices/authSlice";

// setTimeout max delay (~24.8 days); longer tokens are re-checked on next load.
const MAX_TIMEOUT = 2_147_483_647;

/**
 * Client-side session lifecycle:
 * - restores the session from storage on load (expired/invalid token = logged out),
 * - logs out on any 401 from the API (except login),
 * - logs out when the token expires while the app is open.
 */
export default function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const logoutAndRedirect = useLogout();
  const token = useAppSelector((state) => state.auth.token);
  const expiresAt = useAppSelector((state) => state.auth.expiresAt);

  useEffect(() => {
    dispatch(sessionRestored(loadSession()));
  }, [dispatch]);

  useEffect(() => {
    setUnauthorizedHandler(logoutAndRedirect);
    return () => setUnauthorizedHandler(null);
  }, [logoutAndRedirect]);

  useEffect(() => {
    if (!token) return;
    const expiry = getTokenExpiry(token, expiresAt ?? undefined);
    const delay = expiry === null ? 0 : expiry - Date.now();
    if (delay > MAX_TIMEOUT) return;
    const timer = window.setTimeout(logoutAndRedirect, Math.max(delay, 0));
    return () => window.clearTimeout(timer);
  }, [token, expiresAt, logoutAndRedirect]);

  return children;
}
