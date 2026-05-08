"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ORG_ROLE } from "@/lib/organizations/schemas";
import { useTRPC } from "@/lib/trpc/client";

export default function OrgSettingsPage(props: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = use(props.params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const formId = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const orgQuery = useQuery(
    trpc.organizations.getBySlug.queryOptions({ slug: orgSlug }),
  );

  useEffect(() => {
    if (orgQuery.data) {
      setName(orgQuery.data.name);
    }
  }, [orgQuery.data]);

  const updateMutation = useMutation(
    trpc.organizations.update.mutationOptions({
      onSuccess: async (updated) => {
        setError(null);
        await Promise.all([
          queryClient.invalidateQueries(
            trpc.organizations.getBySlug.queryFilter({ slug: orgSlug }),
          ),
          queryClient.invalidateQueries(trpc.organizations.list.queryFilter()),
          queryClient.invalidateQueries(
            trpc.activity.list.queryFilter({ organizationId: updated.id }),
          ),
        ]);
        if (updated.slug !== orgSlug) {
          router.replace(`/o/${updated.slug}/settings`);
        }
      },
      onError: (err) => setError(err.message),
    }),
  );

  const deleteMutation = useMutation(
    trpc.organizations.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.organizations.list.queryFilter(),
        );
        router.replace("/welcome");
      },
      onError: (err) => setError(err.message),
    }),
  );

  if (orgQuery.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full max-w-2xl" />
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
  const isOwner = org.role === ORG_ROLE.OWNER;
  const trimmedName = name.trim();
  const renameDisabled =
    !isOwner ||
    updateMutation.isPending ||
    !trimmedName ||
    trimmedName === org.name;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">Organization settings</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Slug: <span className="font-mono">{org.slug}</span> · Your role:{" "}
          {org.role ?? "—"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rename</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (renameDisabled) return;
              setError(null);
              updateMutation.mutate({ id: org.id, name: trimmedName });
            }}
          >
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor={`${formId}-name`}>Name</Label>
              <Input
                id={`${formId}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isOwner || updateMutation.isPending}
                required
                maxLength={200}
              />
            </div>
            <Button type="submit" disabled={renameDisabled}>
              {updateMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </form>
          {!isOwner ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Only owners can rename this organization.
            </p>
          ) : null}
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
            Deleting this organization is permanent and removes memberships and
            related data.
          </p>
          <div>
            <Button
              variant="destructive"
              disabled={!isOwner || deleteMutation.isPending}
              onClick={() => {
                if (!isOwner) return;
                if (
                  window.confirm(`Delete "${org.name}"? This cannot be undone.`)
                ) {
                  setError(null);
                  deleteMutation.mutate({ id: org.id });
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete organization"}
            </Button>
          </div>
          {!isOwner ? (
            <p className="text-xs text-muted-foreground">
              Only owners can delete this organization.
            </p>
          ) : null}
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
