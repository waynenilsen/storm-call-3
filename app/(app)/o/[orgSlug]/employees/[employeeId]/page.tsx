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
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/lib/trpc/client";

export default function OrgEmployeeDetailPage(props: {
  params: Promise<{ orgSlug: string; employeeId: string }>;
}) {
  const { orgSlug, employeeId } = use(props.params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const formId = useId();

  const [contactId, setContactId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const orgQuery = useQuery(
    trpc.organizations.getBySlug.queryOptions({ slug: orgSlug }),
  );

  const employeeQuery = useQuery(
    trpc.employees.get.queryOptions(
      orgQuery.data
        ? { id: employeeId, organizationId: orgQuery.data.id }
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

  useEffect(() => {
    if (employeeQuery.data) {
      setContactId(employeeQuery.data.contactId);
      setNotes(employeeQuery.data.notes ?? "");
    }
  }, [employeeQuery.data]);

  const updateMutation = useMutation(
    trpc.employees.update.mutationOptions({
      onSuccess: async () => {
        setError(null);
        if (orgQuery.data) {
          await Promise.all([
            queryClient.invalidateQueries(
              trpc.employees.get.queryFilter({
                id: employeeId,
                organizationId: orgQuery.data.id,
              }),
            ),
            queryClient.invalidateQueries(
              trpc.employees.list.queryFilter({
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
    trpc.employees.delete.mutationOptions({
      onSuccess: async () => {
        if (orgQuery.data) {
          await queryClient.invalidateQueries(
            trpc.employees.list.queryFilter({
              organizationId: orgQuery.data.id,
            }),
          );
        }
        router.replace(`/o/${orgSlug}/employees`);
      },
      onError: (err) => setError(err.message),
    }),
  );

  if (orgQuery.isPending || employeeQuery.isPending) {
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

  if (employeeQuery.isError || !employeeQuery.data) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-destructive" role="alert">
          {employeeQuery.error?.message ?? "Employee not found."}
        </p>
        <Link
          href={`/o/${orgSlug}/employees`}
          className="text-sm underline-offset-4 hover:underline"
        >
          Back to employees
        </Link>
      </div>
    );
  }

  const org = orgQuery.data;
  const employee = employeeQuery.data;
  const trimmedNotes = notes.trim();
  const dirty =
    contactId !== employee.contactId || trimmedNotes !== (employee.notes ?? "");
  const saveDisabled = updateMutation.isPending || !dirty || contactId === "";

  const currentContact = (contactsQuery.data ?? []).find(
    (c) => c.id === employee.contactId,
  );
  const titleLabel =
    currentContact?.name ??
    currentContact?.email ??
    currentContact?.phone ??
    "Employee";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium">{titleLabel}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Added by {employee.createdByUserName ?? "—"} ·{" "}
            {new Date(employee.createdAt).toLocaleString()}
          </p>
        </div>
        <Link
          href={`/o/${orgSlug}/employees`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← All employees
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (saveDisabled) return;
              setError(null);
              updateMutation.mutate({
                id: employee.id,
                organizationId: org.id,
                ...(contactId !== employee.contactId ? { contactId } : {}),
                ...(trimmedNotes !== (employee.notes ?? "")
                  ? { notes: trimmedNotes === "" ? null : trimmedNotes }
                  : {}),
              });
            }}
          >
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor={`${formId}-contact`}>Contact</Label>
              <NativeSelect
                id={`${formId}-contact`}
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                disabled={updateMutation.isPending || contactsQuery.isPending}
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
                {currentContact ||
                contactsQuery.isPending ||
                (contactsQuery.data ?? []).some(
                  (c) => c.id === employee.contactId,
                ) ? null : (
                  <NativeSelectOption value={employee.contactId}>
                    Current contact
                  </NativeSelectOption>
                )}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor={`${formId}-notes`}>Notes</Label>
              <Textarea
                id={`${formId}-notes`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={updateMutation.isPending}
                maxLength={4000}
                rows={4}
              />
            </div>
            <div className="sm:col-span-2">
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
            Removing this employee leaves the contact in place.
          </p>
          <div>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(`Remove ${titleLabel}? This cannot be undone.`)
                ) {
                  setError(null);
                  deleteMutation.mutate({
                    id: employee.id,
                    organizationId: org.id,
                  });
                }
              }}
            >
              {deleteMutation.isPending ? "Removing…" : "Remove employee"}
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
