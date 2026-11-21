"use client";

import Image from "next/image";
import Link from "next/link";
import UserMenu from "./UserMenu";

export default function TechnicalOfficeNavbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg">
          <Image src="/logo.png" alt="" width={40} height={40} className="shrink-0 rounded-full" priority />
          <span className="truncate text-base font-bold text-foreground sm:text-lg">منظومة المكتب الفني</span>
        </Link>

        <UserMenu />
      </div>
      <div className="h-0.5 bg-gradient-to-l from-primary via-accent to-primary" aria-hidden="true" />
    </header>
  );
}
