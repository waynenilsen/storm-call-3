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
import {
  MECHANICAL_STATUS,
  type MechanicalStatus,
  TOOL_STATUS,
  type ToolStatus,
} from "@/lib/equipment/schemas";
import { useTRPC } from "@/lib/trpc/client";

const MECHANICAL_STATUS_LABEL: Record<MechanicalStatus, string> = {
  [MECHANICAL_STATUS.OPERATIONAL]: "Operational",
  [MECHANICAL_STATUS.ISSUES]: "Issues",
  [MECHANICAL_STATUS.NOT_OPERATIONAL]: "Not operational",
};

const TOOL_STATUS_LABEL: Record<ToolStatus, string> = {
  [TOOL_STATUS.TOOLED]: "Tooled",
  [TOOL_STATUS.PARTIALLY_TOOLED]: "Partially tooled",
  [TOOL_STATUS.NOT_TOOLED]: "Not tooled",
};

export default function OrgEquipmentPage(props: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = use(props.params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const formId = useId();

  const [companyCode, setCompanyCode] = useState("");
  const [type, setType] = useState("");
  const [subtype, setSubtype] = useState("");
  const [mechanicalStatus, setMechanicalStatus] = useState<
    "" | MechanicalStatus
  >("");
  const [toolStatus, setToolStatus] = useState<"" | ToolStatus>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterMechanical, setFilterMechanical] = useState<
    "" | MechanicalStatus
  >("");
  const [filterTool, setFilterTool] = useState<"" | ToolStatus>("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);

  const orgQuery = useQuery(
    trpc.organizations.getBySlug.queryOptions({ slug: orgSlug }),
  );

  const equipmentQuery = useQuery(
    trpc.equipment.list.queryOptions(
      orgQuery.data
        ? {
            organizationId: orgQuery.data.id,
            limit: 50,
            offset: 0,
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
            ...(filterMechanical ? { mechanicalStatus: filterMechanical } : {}),
            ...(filterTool ? { toolStatus: filterTool } : {}),
          }
        : skipToken,
    ),
  );

  const createMutation = useMutation(
    trpc.equipment.create.mutationOptions({
      onSuccess: async () => {
        setCompanyCode("");
        setType("");
        setSubtype("");
        setMechanicalStatus("");
        setToolStatus("");
        setNotes("");
        setError(null);
        if (orgQuery.data) {
          await Promise.all([
            queryClient.invalidateQueries(
              trpc.equipment.list.queryFilter({
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
  const trimmedCompanyCode = companyCode.trim();
  const trimmedType = type.trim();
  const trimmedSubtype = subtype.trim();
  const trimmedNotes = notes.trim();
  const hasAnyField =
    trimmedCompanyCode.length > 0 ||
    trimmedType.length > 0 ||
    trimmedSubtype.length > 0 ||
    mechanicalStatus !== "" ||
    toolStatus !== "" ||
    trimmedNotes.length > 0;
  const canSubmit = hasAnyField && !createMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">Equipment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track vehicles, tools, and gear used by this organization.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add equipment</CardTitle>
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
                ...(trimmedCompanyCode
                  ? { companyCode: trimmedCompanyCode }
                  : {}),
                ...(trimmedType ? { type: trimmedType } : {}),
                ...(trimmedSubtype ? { subtype: trimmedSubtype } : {}),
                ...(mechanicalStatus ? { mechanicalStatus } : {}),
                ...(toolStatus ? { toolStatus } : {}),
                ...(trimmedNotes ? { notes: trimmedNotes } : {}),
              });
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-companyCode`}>Company code</Label>
              <Input
                id={`${formId}-companyCode`}
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                disabled={createMutation.isPending}
                maxLength={120}
                placeholder="EQ-1024"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-type`}>Type</Label>
              <Input
                id={`${formId}-type`}
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={createMutation.isPending}
                maxLength={120}
                placeholder="vehicle"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-subtype`}>Subtype</Label>
              <Input
                id={`${formId}-subtype`}
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
                disabled={createMutation.isPending}
                maxLength={120}
                placeholder="excavator"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-mech`}>Mechanical status</Label>
              <NativeSelect
                id={`${formId}-mech`}
                value={mechanicalStatus}
                onChange={(e) =>
                  setMechanicalStatus(e.target.value as "" | MechanicalStatus)
                }
                disabled={createMutation.isPending}
                className="w-full"
              >
                <NativeSelectOption value="">—</NativeSelectOption>
                {Object.values(MECHANICAL_STATUS).map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {MECHANICAL_STATUS_LABEL[value]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-tool`}>Tool status</Label>
              <NativeSelect
                id={`${formId}-tool`}
                value={toolStatus}
                onChange={(e) =>
                  setToolStatus(e.target.value as "" | ToolStatus)
                }
                disabled={createMutation.isPending}
                className="w-full"
              >
                <NativeSelectOption value="">—</NativeSelectOption>
                {Object.values(TOOL_STATUS).map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {TOOL_STATUS_LABEL[value]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
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
                placeholder="Any context worth keeping with this asset."
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={!canSubmit}>
                {createMutation.isPending ? "Adding…" : "Add equipment"}
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
          <CardTitle className="text-base">Inventory</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id={`${formId}-search`}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={200}
              placeholder="Search code, type, notes…"
              className="max-w-xs"
              aria-label="Search equipment"
            />
            <NativeSelect
              aria-label="Filter by mechanical status"
              value={filterMechanical}
              onChange={(e) =>
                setFilterMechanical(e.target.value as "" | MechanicalStatus)
              }
            >
              <NativeSelectOption value="">All mechanical</NativeSelectOption>
              {Object.values(MECHANICAL_STATUS).map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {MECHANICAL_STATUS_LABEL[value]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="Filter by tool status"
              value={filterTool}
              onChange={(e) => setFilterTool(e.target.value as "" | ToolStatus)}
            >
              <NativeSelectOption value="">All tool</NativeSelectOption>
              {Object.values(TOOL_STATUS).map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {TOOL_STATUS_LABEL[value]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </CardHeader>
        <CardContent>
          {equipmentQuery.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : equipmentQuery.data && equipmentQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subtype</TableHead>
                  <TableHead>Mechanical</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipmentQuery.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">
                      {row.companyCode ?? "—"}
                    </TableCell>
                    <TableCell>{row.type ?? "—"}</TableCell>
                    <TableCell>{row.subtype ?? "—"}</TableCell>
                    <TableCell>
                      {row.mechanicalStatus
                        ? (MECHANICAL_STATUS_LABEL[
                            row.mechanicalStatus as MechanicalStatus
                          ] ?? row.mechanicalStatus)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {row.toolStatus
                        ? (TOOL_STATUS_LABEL[row.toolStatus as ToolStatus] ??
                          row.toolStatus)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/o/${orgSlug}/equipment/${row.id}`}
                        className="text-sm underline-offset-4 hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : debouncedSearch || filterMechanical || filterTool ? (
            <p className="text-sm text-muted-foreground">
              No equipment matches the current filters.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No equipment yet. Add some above to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
