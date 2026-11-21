"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import FullPageLoader from "@/components/FullPageLoader";
import { LOGIN_PATH, loginUrlReturningHere } from "@/lib/returnTo";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { useMeQuery } from "@/rtk/endpoints/authApi";
import { profileUpdated } from "@/rtk/slices/authSlice";

/**
 * Protects every page under `(all)`: no session → /login. Shows a loader until the session is known.
 * Unless the user logged out on purpose, /login gets `?returnTo=` so login comes back here.
 */
export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const loggedOutByUser = useAppSelector((state) => state.auth.loggedOutByUser);

  // Validates the token with the server; a 401 triggers logout via the axios interceptor.
  const { data: me } = useMeQuery(undefined, { skip: status !== "authenticated" });

  useEffect(() => {
    if (status !== "unauthenticated") return;
    // window.location (not useSearchParams) so this layout needs no Suspense boundary in the static export.
    router.replace(loggedOutByUser ? LOGIN_PATH : loginUrlReturningHere());
  }, [status, loggedOutByUser, router]);

  useEffect(() => {
    if (me) dispatch(profileUpdated({ fullName: me.name, email: me.email, role: me.role }));
  }, [me, dispatch]);

  if (status !== "authenticated") return <FullPageLoader />;
  return children;
}
