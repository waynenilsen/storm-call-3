"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { use } from "react";

import { ContactDetailsPanel } from "@/components/conversations/contact-details";
import { ConversationThread } from "@/components/conversations/thread";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc/client";

export default function ConversationThreadPage(props: {
  params: Promise<{ orgSlug: string; conversationId: string }>;
}) {
  const { orgSlug, conversationId } = use(props.params);
  const trpc = useTRPC();

  const orgQuery = useQuery(
    trpc.organizations.getBySlug.queryOptions({ slug: orgSlug }),
  );

  const conversationQuery = useQuery(
    trpc.conversations.get.queryOptions(
      orgQuery.data
        ? { organizationId: orgQuery.data.id, id: conversationId }
        : skipToken,
    ),
  );

  const contactQuery = useQuery(
    trpc.contacts.get.queryOptions(
      orgQuery.data && conversationQuery.data
        ? {
            organizationId: orgQuery.data.id,
            id: conversationQuery.data.contactId,
          }
        : skipToken,
    ),
  );

  if (orgQuery.isPending || conversationQuery.isPending) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (
    orgQuery.isError ||
    !orgQuery.data ||
    conversationQuery.isError ||
    !conversationQuery.data
  ) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">
          {orgQuery.error?.message ??
            conversationQuery.error?.message ??
            "Conversation not found."}
        </p>
      </div>
    );
  }

  const conv = conversationQuery.data;
  const contact = contactQuery.data;

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 min-h-0 flex-1 flex-col">
        <ConversationThread
          organizationId={orgQuery.data.id}
          conversationId={conv.id}
          contactId={conv.contactId}
          contactName={contact?.name}
          contactPhone={contact?.phone}
        />
      </div>
      <aside className="hidden w-80 shrink-0 border-l lg:block">
        <ContactDetailsPanel
          organizationId={orgQuery.data.id}
          contactId={conv.contactId}
          orgSlug={orgSlug}
          conversation={{
            messageCount: conv.messageCount,
            unreadCount: conv.unreadCount,
            lastMessageAt: conv.lastMessageAt,
            createdAt: conv.createdAt,
          }}
        />
      </aside>
    </div>
  );
}
