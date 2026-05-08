"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ContactAvatar } from "@/components/contact-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

function formatRelative(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return "Yesterday";
  }
  const within7 = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) < 7;
  if (within7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ConversationsInbox({
  organizationId,
  orgSlug,
}: {
  organizationId: string;
  orgSlug: string;
}) {
  const trpc = useTRPC();
  const pathname = usePathname();

  const conversationsQuery = useQuery(
    trpc.conversations.list.queryOptions({
      organizationId,
      limit: 100,
      offset: 0,
    }),
  );
  // Conversation rows carry only contactId; we resolve display info by joining
  // against a single contacts.list page on the client. Cheap for dev-scale orgs
  // and avoids a denormalize-or-join decision before there's a need.
  const contactsQuery = useQuery(
    trpc.contacts.list.queryOptions({
      organizationId,
      limit: 100,
      offset: 0,
    }),
  );

  const contactsById = new Map(
    (contactsQuery.data ?? []).map((c) => [c.id, c]),
  );
  const conversations = conversationsQuery.data ?? [];
  const isLoading = conversationsQuery.isPending || contactsQuery.isPending;

  return (
    <div className="flex h-full flex-col bg-card">
      <header className="flex h-14 shrink-0 items-center border-b px-4">
        <h2 className="text-sm font-semibold">Conversations</h2>
        <span className="ml-2 text-xs text-muted-foreground">
          {conversations.length}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No conversations yet. Add a contact to start a thread.
          </p>
        ) : (
          <ul>
            {conversations.map((conv) => {
              const contact = contactsById.get(conv.contactId);
              const name = contact?.name ?? contact?.phone ?? "Unknown";
              const isUnread = conv.unreadCount > 0;
              const href = `/o/${orgSlug}/conversations/${conv.id}`;
              const active = pathname === href;
              const preview =
                conv.lastMessageDirection === "outbound"
                  ? `You: ${conv.lastMessagePreview ?? ""}`
                  : (conv.lastMessagePreview ?? "No messages yet.");
              return (
                <li key={conv.id}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 border-l-2 px-4 py-3 transition-colors",
                      active
                        ? "border-l-primary bg-muted/70"
                        : "border-l-transparent hover:bg-muted/40",
                    )}
                  >
                    <ContactAvatar
                      id={contact?.id ?? conv.contactId}
                      name={contact?.name}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            isUnread ? "font-semibold" : "font-medium",
                          )}
                        >
                          {name}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-xs",
                            isUnread
                              ? "font-medium text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {formatRelative(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p
                          className={cn(
                            "min-w-0 flex-1 truncate text-xs",
                            isUnread
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {preview}
                        </p>
                        {isUnread ? (
                          <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                            {conv.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
