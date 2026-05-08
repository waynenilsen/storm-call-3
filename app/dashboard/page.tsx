"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const trpc = useTRPC();
  const sessionQuery = useQuery(
    trpc.auth.session.queryOptions(undefined, { staleTime: 60_000 }),
  );
  const orgsQuery = useQuery(
    trpc.organizations.list.queryOptions({ limit: 5, offset: 0 }),
  );

  if (!sessionQuery.data) return null;
  const user = sessionQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">Hello, {user.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Organizations</CardTitle>
          <Link
            href="/dashboard/organizations"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Manage
          </Link>
        </CardHeader>
        <CardContent>
          {orgsQuery.isPending ? (
            <Skeleton className="h-12 w-full" />
          ) : orgsQuery.data && orgsQuery.data.length > 0 ? (
            <ul className="flex flex-col divide-y">
              {orgsQuery.data.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between py-2"
                >
                  <Link
                    href={`/dashboard/organizations/${o.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {o.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {o.role}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No organizations yet.{" "}
              <Link
                href="/dashboard/organizations"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Create one.
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
