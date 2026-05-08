"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc/client";

export default function OrganizationsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const formId = useId();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const listQuery = useQuery(
    trpc.organizations.list.queryOptions({ limit: 50, offset: 0 }),
  );

  const createMutation = useMutation(
    trpc.organizations.create.mutationOptions({
      onSuccess: async () => {
        setName("");
        setError(null);
        await queryClient.invalidateQueries(
          trpc.organizations.list.queryFilter(),
        );
      },
      onError: (err) => {
        setError(err.message);
      },
    }),
  );

  const trimmedName = name.trim();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">Organizations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Anyone signed in can create an organization. The creator becomes its
          owner.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (!trimmedName) return;
              setError(null);
              createMutation.mutate({ name: trimmedName });
            }}
          >
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor={`${formId}-name`}>Name</Label>
              <Input
                id={`${formId}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createMutation.isPending}
                placeholder="Acme, Inc."
                required
                maxLength={200}
              />
            </div>
            <Button
              type="submit"
              disabled={createMutation.isPending || !trimmedName}
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </form>
          {error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Your organizations
        </h2>
        {listQuery.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : listQuery.isError ? (
          <p className="text-sm text-destructive" role="alert">
            Failed to load organizations.
          </p>
        ) : listQuery.data && listQuery.data.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {listQuery.data.map((org) => (
              <li key={org.id}>
                <Link
                  href={`/dashboard/organizations/${org.id}`}
                  className="block rounded-md border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{org.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {org.role}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No organizations yet. Create one above to get started.
          </p>
        )}
      </div>
    </div>
  );
}
