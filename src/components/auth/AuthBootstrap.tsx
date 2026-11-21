"use client";

import { useEffect, type ReactNode } from "react";
import { setUnauthorizedHandler } from "@/lib/axios";
import { loadApiUrl } from "@/lib/config";
import { getTokenExpiry, loadSession, subscribeToSessionChanges } from "@/lib/session";
import { useLogout } from "@/hooks/useLogout";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { sessionRestored, syncSessionFromOtherTab } from "@/rtk/slices/authSlice";

// setTimeout max delay (~24.8 days); longer tokens are re-checked on next load.
const MAX_TIMEOUT = 2_147_483_647;

/**
 * Client-side session lifecycle:
 * - restores the session from storage on load (expired/invalid token = logged out),
 * - follows logins/logouts done in other tabs (`storage` event),
 * - logs out on any 401 from the API (except login),
 * - logs out when the token expires while the app is open.
 * Redirects are done by AuthGuard / GuestGuard.
 */
export default function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const logout = useLogout();
  const token = useAppSelector((state) => state.auth.token);
  const expiresAt = useAppSelector((state) => state.auth.expiresAt);

  useEffect(() => {
    void loadApiUrl(); // start loading /config.json early; API calls await it anyway
    dispatch(sessionRestored(loadSession()));
    return subscribeToSessionChanges((session) => dispatch(syncSessionFromOtherTab(session)));
  }, [dispatch]);

  // Rejected or expired token: not a user logout, so login will return to the current page.
  useEffect(() => {
    setUnauthorizedHandler(() => logout({ byUser: false }));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!token) return;
    const expiry = getTokenExpiry(token, expiresAt ?? undefined);
    const delay = expiry === null ? 0 : expiry - Date.now();
    if (delay > MAX_TIMEOUT) return;
    const timer = window.setTimeout(() => logout({ byUser: false }), Math.max(delay, 0));
    return () => window.clearTimeout(timer);
  }, [token, expiresAt, logout]);

  return children;
}
