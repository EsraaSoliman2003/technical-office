"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import FullPageLoader from "@/components/FullPageLoader";
import { returnToFromLocation } from "@/lib/returnTo";
import { useAppSelector } from "@/rtk/hooks";

/** For /login: signed in (now, or already) → the validated `?returnTo=` page, else home. */
export default function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    if (status === "authenticated") router.replace(returnToFromLocation());
  }, [status, router]);

  if (status !== "unauthenticated") return <FullPageLoader />;
  return children;
}
