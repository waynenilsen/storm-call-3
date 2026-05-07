"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        Storm Call
      </Link>
      <nav className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className={cn(buttonVariants({ variant: "default", size: "sm" }))}
        >
          Sign up
        </Link>
      </nav>
    </header>
  );
}
