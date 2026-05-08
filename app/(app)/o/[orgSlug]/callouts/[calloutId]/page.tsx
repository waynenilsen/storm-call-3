"use client";

import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/lib/trpc/client";

export default function OrgCalloutDetailPage(props: {
  params: Promise<{ orgSlug: string; calloutId: string }>;
}) {
  const { orgSlug, calloutId } = use(props.params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const formId = useId();

  const [name, setName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const orgQuery = useQuery(
    trpc.organizations.getBySlug.queryOptions({ slug: orgSlug }),
  );

  const calloutQuery = useQuery(
    trpc.callouts.get.queryOptions(
      orgQuery.data
        ? { id: calloutId, organizationId: orgQuery.data.id }
        : skipToken,
    ),
  );

  useEffect(() => {
    if (calloutQuery.data) {
      setName(calloutQuery.data.name);
      setMessageText(calloutQuery.data.messageText);
    }
  }, [calloutQuery.data]);

  const updateMutation = useMutation(
    trpc.callouts.update.mutationOptions({
      onSuccess: async () => {
        setError(null);
        if (orgQuery.data) {
          await Promise.all([
            queryClient.invalidateQueries(
              trpc.callouts.get.queryFilter({
                id: calloutId,
                organizationId: orgQuery.data.id,
              }),
            ),
            queryClient.invalidateQueries(
              trpc.callouts.list.queryFilter({
                organizationId: orgQuery.data.id,
              }),
            ),
            queryClient.invalidateQueries(
              trpc.activity.list.queryFilter({
                organizationId: orgQuery.data.id,
              }),
            ),
          ]);
        }
      },
      onError: (err) => setError(err.message),
    }),
  );

  const deleteMutation = useMutation(
    trpc.callouts.delete.mutationOptions({
      onSuccess: async () => {
        if (orgQuery.data) {
          await Promise.all([
            queryClient.invalidateQueries(
              trpc.callouts.list.queryFilter({
                organizationId: orgQuery.data.id,
              }),
            ),
            queryClient.invalidateQueries(
              trpc.activity.list.queryFilter({
                organizationId: orgQuery.data.id,
              }),
            ),
          ]);
        }
        router.replace(`/o/${orgSlug}/callouts`);
      },
      onError: (err) => setError(err.message),
    }),
  );

  if (orgQuery.isPending || calloutQuery.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full max-w-2xl" />
      </div>
    );
  }

  if (orgQuery.isError || !orgQuery.data) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {orgQuery.error?.message ?? "Organization not found."}
      </p>
    );
  }

  if (calloutQuery.isError || !calloutQuery.data) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-destructive" role="alert">
          {calloutQuery.error?.message ?? "Callout not found."}
        </p>
        <Link
          href={`/o/${orgSlug}/callouts`}
          className="text-sm underline-offset-4 hover:underline"
        >
          Back to callouts
        </Link>
      </div>
    );
  }

  const org = orgQuery.data;
  const callout = calloutQuery.data;
  const trimmedName = name.trim();
  const trimmedMessage = messageText.trim();
  const dirty =
    trimmedName !== callout.name || trimmedMessage !== callout.messageText;
  const saveDisabled =
    updateMutation.isPending ||
    !dirty ||
    trimmedName.length === 0 ||
    trimmedMessage.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium">{callout.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Created by {callout.createdByUserName ?? "—"} ·{" "}
            {new Date(callout.createdAt).toLocaleString()}
          </p>
        </div>
        <Link
          href={`/o/${orgSlug}/callouts`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← All callouts
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (saveDisabled) return;
              setError(null);
              updateMutation.mutate({
                id: callout.id,
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
                disabled={updateMutation.isPending}
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
                disabled={updateMutation.isPending}
                required
                maxLength={1600}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {trimmedMessage.length} / 1600 characters
              </p>
            </div>
            <div>
              <Button type="submit" disabled={saveDisabled}>
                {updateMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Deleting this callout is permanent.
          </p>
          <div>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete "${callout.name}"? This cannot be undone.`,
                  )
                ) {
                  setError(null);
                  deleteMutation.mutate({
                    id: callout.id,
                    organizationId: org.id,
                  });
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete callout"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
