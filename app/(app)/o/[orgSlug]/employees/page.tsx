"use client";

import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { use, useEffect, useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/lib/trpc/client";

export default function OrgEmployeesPage(props: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = use(props.params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const formId = useId();

  const [contactId, setContactId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);

  const orgQuery = useQuery(
    trpc.organizations.getBySlug.queryOptions({ slug: orgSlug }),
  );

  const employeesQuery = useQuery(
    trpc.employees.list.queryOptions(
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

  const contactsQuery = useQuery(
    trpc.contacts.list.queryOptions(
      orgQuery.data
        ? { organizationId: orgQuery.data.id, limit: 100, offset: 0 }
        : skipToken,
    ),
  );

  const contactsById = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string | null; email: string | null }
    >();
    for (const c of contactsQuery.data ?? []) {
      map.set(c.id, { id: c.id, name: c.name, email: c.email });
    }
    return map;
  }, [contactsQuery.data]);

  const createMutation = useMutation(
    trpc.employees.create.mutationOptions({
      onSuccess: async () => {
        setContactId("");
        setNotes("");
        setError(null);
        if (orgQuery.data) {
          await queryClient.invalidateQueries(
            trpc.employees.list.queryFilter({
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
  const trimmedNotes = notes.trim();
  const canSubmit = contactId !== "" && !createMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">Employees</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          People who serve this organization. Each employee links to a contact.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add employee</CardTitle>
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
                contactId,
                ...(trimmedNotes ? { notes: trimmedNotes } : {}),
              });
            }}
          >
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor={`${formId}-contact`}>Contact</Label>
              <NativeSelect
                id={`${formId}-contact`}
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                disabled={createMutation.isPending || contactsQuery.isPending}
                className="w-full"
              >
                <NativeSelectOption value="">
                  {contactsQuery.isPending
                    ? "Loading contacts…"
                    : "Choose a contact"}
                </NativeSelectOption>
                {(contactsQuery.data ?? []).map((c) => (
                  <NativeSelectOption key={c.id} value={c.id}>
                    {c.name ?? c.email ?? c.phone ?? c.id}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {!contactsQuery.isPending &&
              (contactsQuery.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No contacts yet.{" "}
                  <Link
                    href={`/o/${orgSlug}/contacts`}
                    className="underline-offset-4 hover:underline"
                  >
                    Create one
                  </Link>{" "}
                  first.
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor={`${formId}-notes`}>Notes</Label>
              <Textarea
                id={`${formId}-notes`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={createMutation.isPending}
                maxLength={4000}
                rows={3}
                placeholder="Anything worth remembering about this person's role."
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={!canSubmit}>
                {createMutation.isPending ? "Adding…" : "Add employee"}
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
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Employees</CardTitle>
          <Input
            id={`${formId}-search`}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={200}
            placeholder="Search name, email, notes…"
            className="max-w-xs"
            aria-label="Search employees"
          />
        </CardHeader>
        <CardContent>
          {employeesQuery.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : employeesQuery.data && employeesQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeesQuery.data.map((row) => {
                  const c = contactsById.get(row.contactId);
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{c?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c?.email ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {row.notes ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/o/${orgSlug}/employees/${row.id}`}
                          className="text-sm underline-offset-4 hover:underline"
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : debouncedSearch ? (
            <p className="text-sm text-muted-foreground">
              No employees match the current search.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No employees yet. Add someone above to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
