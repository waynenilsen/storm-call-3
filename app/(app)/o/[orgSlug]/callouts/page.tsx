"use client";

import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { use, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/lib/trpc/client";

export default function OrgCalloutsPage(props: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = use(props.params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const formId = useId();

  const [name, setName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const orgQuery = useQuery(
    trpc.organizations.getBySlug.queryOptions({ slug: orgSlug }),
  );

  const calloutsQuery = useQuery(
    trpc.callouts.list.queryOptions(
      orgQuery.data
        ? {
            organizationId: orgQuery.data.id,
            limit: 50,
            offset: 0,
          }
        : skipToken,
    ),
  );

  const createMutation = useMutation(
    trpc.callouts.create.mutationOptions({
      onSuccess: async () => {
        setName("");
        setMessageText("");
        setError(null);
        if (orgQuery.data) {
          await queryClient.invalidateQueries(
            trpc.callouts.list.queryFilter({
              organizationId: orgQuery.data.id,
            }),
          );
        }
      },
      onError: (err) => setError(err.message),
    }),
  );

  if (orgQuery.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full max-w-3xl" />
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

  const org = orgQuery.data;
  const trimmedName = name.trim();
  const trimmedMessage = messageText.trim();
  const canSubmit =
    trimmedName.length > 0 &&
    trimmedMessage.length > 0 &&
    !createMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">Callouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          SMS blasts you can send to employees in this organization.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New callout</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) return;
              setError(null);
              createMutation.mutate({
                organizationId: org.id,
                name: trimmedName,
                messageText: trimmedMessage,
              });
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-name`}>Name</Label>
              <Input
                id={`${formId}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createMutation.isPending}
                placeholder="Snow day notice"
                required
                maxLength={200}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-message`}>Message</Label>
              <Textarea
                id={`${formId}-message`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={createMutation.isPending}
                placeholder="Hi team — office is closed today."
                required
                maxLength={1600}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {trimmedMessage.length} / 1600 characters
              </p>
            </div>
            <div>
              <Button type="submit" disabled={!canSubmit}>
                {createMutation.isPending ? "Creating…" : "Create"}
              </Button>
            </div>
          </form>
          {error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All callouts</CardTitle>
        </CardHeader>
        <CardContent>
          {calloutsQuery.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : calloutsQuery.data && calloutsQuery.data.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {calloutsQuery.data.map((callout) => (
                <li key={callout.id}>
                  <Link
                    href={`/o/${orgSlug}/callouts/${callout.id}`}
                    className="block rounded-md border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{callout.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(callout.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {callout.messageText}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No callouts yet. Create one above to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
