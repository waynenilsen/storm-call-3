"use client";

import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { use, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ORG_ROLE } from "@/lib/organizations/schemas";
import { useTRPC } from "@/lib/trpc/client";

export default function OrgContactsPage(props: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = use(props.params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const formId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce keystrokes: trigram GIN keeps the query fast, but no need to
  // hit the server on every character.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);

  const orgQuery = useQuery(
    trpc.organizations.getBySlug.queryOptions({ slug: orgSlug }),
  );

  const contactsQuery = useQuery(
    trpc.contacts.list.queryOptions(
      orgQuery.data
        ? {
            organizationId: orgQuery.data.id,
            limit: 50,
            offset: 0,
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
          }
        : skipToken,
    ),
  );

  const createMutation = useMutation(
    trpc.contacts.create.mutationOptions({
      onSuccess: async () => {
        setName("");
        setEmail("");
        setPhone("");
        setError(null);
        if (orgQuery.data) {
          await queryClient.invalidateQueries(
            trpc.contacts.list.queryFilter({
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
  const isOwner = org.role === ORG_ROLE.OWNER;
  const trimmedName = name.trim();
  const canSubmit = isOwner && !createMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">Contacts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          US phone numbers are stored in E.164. Only owners can add contacts.
        </p>
      </div>

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add contact</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!canSubmit) return;
                setError(null);
                createMutation.mutate({
                  organizationId: org.id,
                  ...(trimmedName ? { name: trimmedName } : {}),
                  ...(email.trim()
                    ? { email: email.trim().toLowerCase() }
                    : {}),
                  ...(phone.trim() ? { phone: phone.trim() } : {}),
                });
              }}
            >
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor={`${formId}-name`}>Name (optional)</Label>
                <Input
                  id={`${formId}-name`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={createMutation.isPending}
                  maxLength={200}
                  placeholder="Jordan Smith"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-email`}>Email (optional)</Label>
                <Input
                  id={`${formId}-email`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={createMutation.isPending}
                  placeholder="jordan@example.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-phone`}>Phone US (optional)</Label>
                <Input
                  id={`${formId}-phone`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={createMutation.isPending}
                  placeholder="(206) 555-0199"
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={!canSubmit}>
                  {createMutation.isPending ? "Adding…" : "Add contact"}
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
      ) : (
        <p className="text-sm text-muted-foreground">
          Only organization owners can manage contacts.
        </p>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 sm:flex-row">
          <CardTitle className="text-base">Directory</CardTitle>
          <Input
            id={`${formId}-search`}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={200}
            placeholder="Search name, email, or phone…"
            className="max-w-xs"
            aria-label="Search contacts"
          />
        </CardHeader>
        <CardContent>
          {contactsQuery.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : contactsQuery.data && contactsQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contactsQuery.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name ?? "—"}</TableCell>
                    <TableCell>{row.email ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/o/${orgSlug}/contacts/${row.id}`}
                        className="text-sm underline-offset-4 hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : debouncedSearch ? (
            <p className="text-sm text-muted-foreground">
              No contacts match “{debouncedSearch}”.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No contacts yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
