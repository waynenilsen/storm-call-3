"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trpc = useTRPC();
  const router = useRouter();
  const pathname = usePathname();

  const sessionQuery = useQuery(
    trpc.auth.session.queryOptions(undefined, {
      staleTime: 60_000,
    }),
  );

  useEffect(() => {
    if (sessionQuery.isPending) return;
    if (!sessionQuery.data) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    }
  }, [sessionQuery.isPending, sessionQuery.data, router, pathname]);

  if (sessionQuery.isPending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-6">
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full max-w-2xl" />
        </div>
      </div>
    );
  }

  if (!sessionQuery.data) {
    return null;
  }

  return <DashboardShell user={sessionQuery.data}>{children}</DashboardShell>;
}
