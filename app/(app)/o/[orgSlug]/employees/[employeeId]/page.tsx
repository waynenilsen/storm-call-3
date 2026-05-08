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

export default function OrgEmployeeDetailPage(props: {
  params: Promise<{ orgSlug: string; employeeId: string }>;
}) {
  const { orgSlug, employeeId } = use(props.params);
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

  const employeeQuery = useQuery(
    trpc.employees.get.queryOptions(
      orgQuery.data
        ? { id: employeeId, organizationId: orgQuery.data.id }
        : skipToken,
    ),
  );

  useEffect(() => {
    if (employeeQuery.data) {
      setName(employeeQuery.data.name ?? "");
      setEmail(employeeQuery.data.email ?? "");
      setPhone(employeeQuery.data.phone ?? "");
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
  const isOwner = org.role === ORG_ROLE.OWNER;

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();

  const dirty =
    trimmedName !== (employee.name ?? "") ||
    trimmedEmail !== (employee.email ?? "") ||
    trimmedPhone !== (employee.phone ?? "");

  const saveDisabled = !isOwner || updateMutation.isPending || !dirty;

  const headingLabel =
    employee.name ?? employee.email ?? employee.phone ?? "(no details)";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium">{headingLabel}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Created by {employee.createdByUserName ?? "—"} ·{" "}
            {employee.createdAt
              ? new Date(employee.createdAt).toLocaleString()
              : "—"}
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
                id: employee.id,
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
              Only owners can edit employees.
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
              {employee.createdAt
                ? new Date(employee.createdAt).toLocaleString()
                : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              by {employee.createdByUserName ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Updated</div>
            <div>
              {employee.updatedAt
                ? new Date(employee.updatedAt).toLocaleString()
                : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              by {employee.updatedByUserName ?? "—"}
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
            Deleting this employee is permanent.
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
                    id: employee.id,
                    organizationId: org.id,
                  });
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete employee"}
            </Button>
          </div>
          {!isOwner ? (
            <p className="text-xs text-muted-foreground">
              Only owners can delete employees.
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
