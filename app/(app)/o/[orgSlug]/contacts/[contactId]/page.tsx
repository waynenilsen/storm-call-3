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
import { ORG_ROLE } from "@/lib/organizations/schemas";
import { useTRPC } from "@/lib/trpc/client";

export default function OrgContactDetailPage(props: {
  params: Promise<{ orgSlug: string; contactId: string }>;
}) {
  const { orgSlug, contactId } = use(props.params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const formId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const orgQuery = useQuery(
    trpc.organizations.getBySlug.queryOptions({ slug: orgSlug }),
  );

  const contactQuery = useQuery(
    trpc.contacts.get.queryOptions(
      orgQuery.data
        ? { id: contactId, organizationId: orgQuery.data.id }
        : skipToken,
    ),
  );

  useEffect(() => {
    if (contactQuery.data) {
      setName(contactQuery.data.name ?? "");
      setEmail(contactQuery.data.email ?? "");
      setPhone(contactQuery.data.phone ?? "");
    }
  }, [contactQuery.data]);

  const updateMutation = useMutation(
    trpc.contacts.update.mutationOptions({
      onSuccess: async () => {
        setError(null);
        if (orgQuery.data) {
          await Promise.all([
            queryClient.invalidateQueries(
              trpc.contacts.get.queryFilter({
                id: contactId,
                organizationId: orgQuery.data.id,
              }),
            ),
            queryClient.invalidateQueries(
              trpc.contacts.list.queryFilter({
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
    trpc.contacts.delete.mutationOptions({
      onSuccess: async () => {
        if (orgQuery.data) {
          await queryClient.invalidateQueries(
            trpc.contacts.list.queryFilter({
              organizationId: orgQuery.data.id,
            }),
          );
        }
        router.replace(`/o/${orgSlug}/contacts`);
      },
      onError: (err) => setError(err.message),
    }),
  );

  if (orgQuery.isPending || contactQuery.isPending) {
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

  if (contactQuery.isError || !contactQuery.data) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-destructive" role="alert">
          {contactQuery.error?.message ?? "Contact not found."}
        </p>
        <Link
          href={`/o/${orgSlug}/contacts`}
          className="text-sm underline-offset-4 hover:underline"
        >
          Back to contacts
        </Link>
      </div>
    );
  }

  const org = orgQuery.data;
  const contact = contactQuery.data;
  const isOwner = org.role === ORG_ROLE.OWNER;

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();

  const dirty =
    trimmedName !== (contact.name ?? "") ||
    trimmedEmail !== (contact.email ?? "") ||
    trimmedPhone !== (contact.phone ?? "");

  const saveDisabled = !isOwner || updateMutation.isPending || !dirty;

  const headingLabel =
    contact.name ?? contact.email ?? contact.phone ?? "(no details)";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium">{headingLabel}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Created by {contact.createdByUserName ?? "—"} ·{" "}
            {contact.createdAt
              ? new Date(contact.createdAt).toLocaleString()
              : "—"}
          </p>
        </div>
        <Link
          href={`/o/${orgSlug}/contacts`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← All contacts
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (saveDisabled) return;
              setError(null);
              updateMutation.mutate({
                id: contact.id,
                organizationId: org.id,
                ...(trimmedName ? { name: trimmedName } : {}),
                ...(trimmedEmail ? { email: trimmedEmail.toLowerCase() } : {}),
                ...(trimmedPhone ? { phone: trimmedPhone } : {}),
              });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-name`}>Name</Label>
                <Input
                  id={`${formId}-name`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isOwner || updateMutation.isPending}
                  maxLength={200}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-email`}>Email</Label>
                <Input
                  id={`${formId}-email`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isOwner || updateMutation.isPending}
                  maxLength={254}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-phone`}>Phone US</Label>
                <Input
                  id={`${formId}-phone`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isOwner || updateMutation.isPending}
                  maxLength={64}
                />
              </div>
            </div>
            <div>
              <Button type="submit" disabled={saveDisabled}>
                {updateMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
          {!isOwner ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Only owners can edit contacts.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Created</div>
            <div>
              {contact.createdAt
                ? new Date(contact.createdAt).toLocaleString()
                : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              by {contact.createdByUserName ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Updated</div>
            <div>
              {contact.updatedAt
                ? new Date(contact.updatedAt).toLocaleString()
                : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              by {contact.updatedByUserName ?? "—"}
            </div>
          </div>
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
            Deleting this contact is permanent.
          </p>
          <div>
            <Button
              variant="destructive"
              disabled={!isOwner || deleteMutation.isPending}
              onClick={() => {
                if (!isOwner) return;
                if (
                  window.confirm(
                    `Delete ${headingLabel}? This cannot be undone.`,
                  )
                ) {
                  setError(null);
                  deleteMutation.mutate({
                    id: contact.id,
                    organizationId: org.id,
                  });
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete contact"}
            </Button>
          </div>
          {!isOwner ? (
            <p className="text-xs text-muted-foreground">
              Only owners can delete contacts.
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
