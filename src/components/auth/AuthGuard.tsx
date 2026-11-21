"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import FullPageLoader from "@/components/FullPageLoader";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { useMeQuery } from "@/rtk/endpoints/authApi";
import { profileUpdated } from "@/rtk/slices/authSlice";

/** Protects every page under `(all)`: no session → /login. Shows a loader until the session is known. */
export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);

  // Validates the token with the server; a 401 triggers logout via the axios interceptor.
  const { data: me } = useMeQuery(undefined, { skip: status !== "authenticated" });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (me) dispatch(profileUpdated({ fullName: me.name, email: me.email, role: me.role }));
  }, [me, dispatch]);

  if (status !== "authenticated") return <FullPageLoader />;
  return children;
}
