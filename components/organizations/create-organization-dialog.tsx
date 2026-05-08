"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/lib/trpc/client";

export function CreateOrganizationDialog({
  triggerLabel = "Create another organization",
  triggerVariant = "outline",
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: {
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const formId = useId();

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation(
    trpc.organizations.create.mutationOptions({
      onSuccess: async (org) => {
        await queryClient.invalidateQueries(
          trpc.organizations.list.queryFilter(),
        );
        setName("");
        setError(null);
        setOpen(false);
        router.push(`/o/${org.slug}`);
      },
      onError: (err) => {
        setError(err.message);
      },
    }),
  );

  const trimmedName = name.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setName("");
          setError(null);
        }
      }}
    >
      {showTrigger ? (
        <DialogTrigger
          render={
            <Button type="button" variant={triggerVariant} className="w-full" />
          }
        >
          {triggerLabel}
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new organization</DialogTitle>
          <DialogDescription>
            You will become the owner of a new, separate organization.{" "}
            <span className="font-medium text-foreground">
              This action cannot be undone.
            </span>{" "}
            If a teammate already created one for your company, ask for an
            invite instead — multiple orgs for the same team are usually not
            useful.
          </DialogDescription>
        </DialogHeader>
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
              autoFocus
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={createMutation.isPending || !trimmedName}
            >
              {createMutation.isPending ? "Creating…" : "Create organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
