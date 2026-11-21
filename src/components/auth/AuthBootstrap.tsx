"use client";

import { useEffect, type ReactNode } from "react";
import { setUnauthorizedHandler } from "@/lib/axios";
import { loadApiUrl } from "@/lib/config";
import { getTokenExpiry, loadSession, subscribeToSessionChanges } from "@/lib/session";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { endRejectedSession, sessionRestored, syncSessionFromOtherTab } from "@/rtk/slices/authSlice";

// setTimeout max delay (~24.8 days); longer tokens are re-checked on next load.
const MAX_TIMEOUT = 2_147_483_647;

/**
 * Client-side session lifecycle:
 * - restores the session from storage on load (expired/invalid token = logged out),
 * - follows logins/logouts done in other tabs (`storage` event, read-only),
 * - ends the session on a 401 from the API (except login) or when the token expires;
 *   storage is cleared only if it still holds that token.
 * Redirects are done by AuthGuard / GuestGuard.
 */
export default function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const expiresAt = useAppSelector((state) => state.auth.expiresAt);

  useEffect(() => {
    void loadApiUrl(); // start loading /config.json early; API calls await it anyway
    dispatch(sessionRestored(loadSession()));
    return subscribeToSessionChanges((session) => dispatch(syncSessionFromOtherTab(session)));
  }, [dispatch]);

  useEffect(() => {
    setUnauthorizedHandler((rejectedToken) => dispatch(endRejectedSession(rejectedToken)));
    return () => setUnauthorizedHandler(null);
  }, [dispatch]);

  useEffect(() => {
    if (!token) return;
    const expiry = getTokenExpiry(token, expiresAt ?? undefined);
    const delay = expiry === null ? 0 : expiry - Date.now();
    if (delay > MAX_TIMEOUT) return;
    const timer = window.setTimeout(() => dispatch(endRejectedSession(token)), Math.max(delay, 0));
    return () => window.clearTimeout(timer);
  }, [token, expiresAt, dispatch]);

  return children;
}
