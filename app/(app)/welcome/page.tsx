"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/lib/trpc/client";

export default function WelcomePage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const formId = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation(
    trpc.organizations.create.mutationOptions({
      onSuccess: async (org) => {
        setName("");
        setError(null);
        await queryClient.invalidateQueries(
          trpc.organizations.list.queryFilter(),
        );
        router.replace(`/o/${org.slug}`);
      },
      onError: (err) => {
        setError(err.message);
      },
    }),
  );

  const trimmedName = name.trim();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You are not in any organization yet. If a teammate already created one
          for your company, ask for an invite instead of creating a
          duplicate—multiple orgs for the same team are usually not useful.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create an organization</CardTitle>
          <CardDescription>
            You will become the owner. You can invite others later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!trimmedName) return;
              setError(null);
              createMutation.mutate({ name: trimmedName });
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-name`}>Organization name</Label>
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
              {createMutation.isPending ? "Creating…" : "Create organization"}
            </Button>
          </form>
          {error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          Back to marketing
        </Link>
      </p>
    </div>
  );
}
