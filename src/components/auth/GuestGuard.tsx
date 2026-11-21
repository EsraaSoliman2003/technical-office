"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import FullPageLoader from "@/components/FullPageLoader";
import { useAppSelector } from "@/rtk/hooks";

/** For /login: already signed in → home. */
export default function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  if (status !== "unauthenticated") return <FullPageLoader />;
  return children;
}
