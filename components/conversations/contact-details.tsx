"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { ContactAvatar } from "@/components/contact-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc/client";

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className={mono ? "font-mono text-sm" : "text-sm"}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export function ContactDetailsPanel({
  organizationId,
  contactId,
  orgSlug,
  conversation,
}: {
  organizationId: string;
  contactId: string;
  orgSlug: string;
  conversation: {
    messageCount: number;
    unreadCount: number;
    lastMessageAt: Date | string | null;
    createdAt: Date | string;
  };
}) {
  const trpc = useTRPC();
  const contactQuery = useQuery(
    trpc.contacts.get.queryOptions({ organizationId, id: contactId }),
  );

  if (contactQuery.isPending) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="size-20 self-center rounded-full" />
        <Skeleton className="h-4 w-2/3 self-center" />
        <Skeleton className="h-3 w-1/2 self-center" />
      </div>
    );
  }

  const contact = contactQuery.data;
  if (!contact) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Contact unavailable.</p>
      </div>
    );
  }

  const lastAt = conversation.lastMessageAt
    ? new Date(conversation.lastMessageAt)
    : null;
  const startedAt = new Date(conversation.createdAt);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-card">
      <div className="flex flex-col items-center gap-2 border-b p-6">
        <ContactAvatar
          id={contact.id}
          name={contact.name}
          size="lg"
          className="size-20"
        />
        <p className="mt-1 text-base font-semibold">
          {contact.name ?? contact.phone ?? "Unknown"}
        </p>
        {contact.phone ? (
          <p className="font-mono text-xs text-muted-foreground">
            {contact.phone}
          </p>
        ) : null}
        <Link
          href={`/o/${orgSlug}/contacts/${contact.id}`}
          className="mt-2 text-xs text-primary underline-offset-4 hover:underline"
        >
          Full contact profile →
        </Link>
      </div>

      <section className="flex flex-col gap-4 border-b p-6">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Contact info
        </h3>
        <DetailField label="Phone" value={contact.phone} mono />
        <DetailField label="Email" value={contact.email} />
        <DetailField
          label="Added"
          value={
            contact.createdAt
              ? new Date(contact.createdAt).toLocaleDateString([], {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : null
          }
        />
        <DetailField label="Added by" value={contact.createdByUserName} />
      </section>

      <section className="flex flex-col gap-4 p-6">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Conversation
        </h3>
        <DetailField
          label="Messages"
          value={String(conversation.messageCount)}
        />
        <DetailField label="Unread" value={String(conversation.unreadCount)} />
        <DetailField
          label="Last activity"
          value={
            lastAt
              ? lastAt.toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : null
          }
        />
        <DetailField
          label="Started"
          value={startedAt.toLocaleDateString([], {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        />
      </section>
    </div>
  );
}
