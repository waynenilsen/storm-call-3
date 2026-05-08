"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";

import { ContactAvatar } from "@/components/contact-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  direction: string;
  sentByUserName: string | null;
  createdAt: Date | string;
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(d: Date) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dayKey(d) === dayKey(now)) return "Today";
  if (dayKey(d) === dayKey(yesterday)) return "Yesterday";
  const within7 = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) < 7;
  if (within7) {
    return d.toLocaleDateString([], { weekday: "long" });
  }
  return d.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: now.getFullYear() === d.getFullYear() ? undefined : "numeric",
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function ConversationThreadHeader({
  contactId,
  contactName,
  contactPhone,
}: {
  contactId: string;
  contactName: string | null | undefined;
  contactPhone: string | null | undefined;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-6">
      <ContactAvatar id={contactId} name={contactName} size="default" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {contactName ?? contactPhone ?? "Unknown"}
        </p>
        {contactPhone ? (
          <p className="truncate font-mono text-xs text-muted-foreground">
            {contactPhone}
          </p>
        ) : null}
      </div>
    </header>
  );
}

function ThreadBubble({
  message,
  contactId,
  contactName,
}: {
  message: Message;
  contactId: string;
  contactName: string | null | undefined;
}) {
  const isOutbound = message.direction === "outbound";
  const ts =
    message.createdAt instanceof Date
      ? message.createdAt
      : new Date(message.createdAt);
  return (
    <li
      className={cn(
        "flex items-end gap-2",
        isOutbound ? "justify-end" : "justify-start",
      )}
    >
      {isOutbound ? null : (
        <ContactAvatar id={contactId} name={contactName} size="sm" />
      )}
      <div
        className={cn("flex max-w-[75%] flex-col", isOutbound && "items-end")}
      >
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words",
            isOutbound
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-muted text-foreground",
          )}
        >
          {message.content}
        </div>
        <p className="mt-1 px-1 text-[11px] text-muted-foreground">
          {isOutbound && message.sentByUserName
            ? `${message.sentByUserName} • ${formatTime(ts)}`
            : formatTime(ts)}
        </p>
      </div>
    </li>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <li className="relative my-4 flex items-center justify-center">
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      <span className="relative rounded-full border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
    </li>
  );
}

export function ConversationThread({
  organizationId,
  conversationId,
  contactId,
  contactName,
  contactPhone,
}: {
  organizationId: string;
  conversationId: string;
  contactId: string;
  contactName: string | null | undefined;
  contactPhone: string | null | undefined;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const formId = useId();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const messagesQuery = useQuery(
    trpc.messages.list.queryOptions({
      organizationId,
      conversationId,
      limit: 100,
      offset: 0,
    }),
  );

  const sendMutation = useMutation(
    trpc.messages.send.mutationOptions({
      onSuccess: async () => {
        setDraft("");
        setError(null);
        await Promise.all([
          queryClient.invalidateQueries(
            trpc.messages.list.queryFilter({
              organizationId,
              conversationId,
            }),
          ),
          queryClient.invalidateQueries(
            trpc.conversations.get.queryFilter({
              organizationId,
              id: conversationId,
            }),
          ),
          queryClient.invalidateQueries(
            trpc.conversations.list.queryFilter({ organizationId }),
          ),
        ]);
      },
      onError: (err) => setError(err.message),
    }),
  );

  // Service returns newest-first; reverse for top-down display.
  const ascending = [...(messagesQuery.data ?? [])].reverse();
  const trimmedDraft = draft.trim();
  const canSend = trimmedDraft.length > 0 && !sendMutation.isPending;

  // Interleave date separators by walking the ascending list and inserting a
  // pill whenever the day changes. Done at render time rather than precomputed
  // because the list is small and React handles keys cleanly.
  const items: Array<
    | { kind: "separator"; key: string; label: string }
    | { kind: "message"; message: Message }
  > = [];
  let lastKey: string | null = null;
  for (const m of ascending) {
    const ts =
      m.createdAt instanceof Date ? m.createdAt : new Date(m.createdAt);
    const key = dayKey(ts);
    if (key !== lastKey) {
      items.push({ kind: "separator", key, label: dayLabel(ts) });
      lastKey = key;
    }
    items.push({ kind: "message", message: m });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ConversationThreadHeader
        contactId={contactId}
        contactName={contactName}
        contactPhone={contactPhone}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {messagesQuery.isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : ascending.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Send the first one below.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) =>
              item.kind === "separator" ? (
                <DateSeparator key={`sep-${item.key}`} label={item.label} />
              ) : (
                <ThreadBubble
                  key={item.message.id}
                  message={item.message}
                  contactId={contactId}
                  contactName={contactName}
                />
              ),
            )}
          </ul>
        )}
      </div>

      <form
        className="shrink-0 border-t bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSend) return;
          setError(null);
          sendMutation.mutate({
            organizationId,
            conversationId,
            content: trimmedDraft,
          });
        }}
      >
        <div className="flex items-end gap-2">
          <Textarea
            id={`${formId}-draft`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={sendMutation.isPending}
            placeholder="Write a message…"
            maxLength={1600}
            rows={2}
            className="resize-none"
            aria-label="Message"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSend) {
                e.preventDefault();
                sendMutation.mutate({
                  organizationId,
                  conversationId,
                  content: trimmedDraft,
                });
              }
            }}
          />
          <Button type="submit" disabled={!canSend}>
            {sendMutation.isPending ? "Sending…" : "Send"}
          </Button>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>⌘/Ctrl+Enter to send</span>
          <span>{trimmedDraft.length} / 1600</span>
        </div>
        {error ? (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
