"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";

import { ConversationsInbox } from "@/components/conversations/inbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc/client";

export default function ConversationsLayout({
  params,
  children,
}: {
  params: Promise<{ orgSlug: string }>;
  children: React.ReactNode;
}) {
  const { orgSlug } = use(params);
  const trpc = useTRPC();
  const orgQuery = useQuery(
    trpc.organizations.getBySlug.queryOptions({ slug: orgSlug }),
  );

  if (orgQuery.isPending) {
    return (
      <div className="-m-6 flex min-h-0 flex-1">
        <div className="w-80 shrink-0 border-r p-4">
          <Skeleton className="h-8 w-3/4" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-1/3" />
        </div>
      </div>
    );
  }

  if (orgQuery.isError || !orgQuery.data) {
    return (
      <p className="text-sm text-destructive">
        {orgQuery.error?.message ?? "Organization not found."}
      </p>
    );
  }

  // Negative margins escape the OrgAppShell's main padding so the three-pane
  // messaging UI runs edge-to-edge with no inset.
  return (
    <div className="-m-6 flex min-h-0 flex-1">
      <aside className="w-80 shrink-0 overflow-hidden border-r">
        <ConversationsInbox
          organizationId={orgQuery.data.id}
          orgSlug={orgSlug}
        />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
