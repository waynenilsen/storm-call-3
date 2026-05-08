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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function OrgEquipmentDetailPage(props: {
  params: Promise<{ orgSlug: string; equipmentId: string }>;
}) {
  const { orgSlug, equipmentId } = use(props.params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
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

  const orgQuery = useQuery(
    trpc.organizations.getBySlug.queryOptions({ slug: orgSlug }),
  );

  const equipmentQuery = useQuery(
    trpc.equipment.get.queryOptions(
      orgQuery.data
        ? { id: equipmentId, organizationId: orgQuery.data.id }
        : skipToken,
    ),
  );

  useEffect(() => {
    if (equipmentQuery.data) {
      setCompanyCode(equipmentQuery.data.companyCode ?? "");
      setType(equipmentQuery.data.type ?? "");
      setSubtype(equipmentQuery.data.subtype ?? "");
      setMechanicalStatus(
        (equipmentQuery.data.mechanicalStatus as "" | MechanicalStatus) ?? "",
      );
      setToolStatus((equipmentQuery.data.toolStatus as "" | ToolStatus) ?? "");
      setNotes(equipmentQuery.data.notes ?? "");
    }
  }, [equipmentQuery.data]);

  const updateMutation = useMutation(
    trpc.equipment.update.mutationOptions({
      onSuccess: async () => {
        setError(null);
        if (orgQuery.data) {
          await Promise.all([
            queryClient.invalidateQueries(
              trpc.equipment.get.queryFilter({
                id: equipmentId,
                organizationId: orgQuery.data.id,
              }),
            ),
            queryClient.invalidateQueries(
              trpc.equipment.list.queryFilter({
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
    trpc.equipment.delete.mutationOptions({
      onSuccess: async () => {
        if (orgQuery.data) {
          await queryClient.invalidateQueries(
            trpc.equipment.list.queryFilter({
              organizationId: orgQuery.data.id,
            }),
          );
        }
        router.replace(`/o/${orgSlug}/equipment`);
      },
      onError: (err) => setError(err.message),
    }),
  );

  if (orgQuery.isPending || equipmentQuery.isPending) {
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

  if (equipmentQuery.isError || !equipmentQuery.data) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-destructive" role="alert">
          {equipmentQuery.error?.message ?? "Equipment not found."}
        </p>
        <Link
          href={`/o/${orgSlug}/equipment`}
          className="text-sm underline-offset-4 hover:underline"
        >
          Back to equipment
        </Link>
      </div>
    );
  }

  const org = orgQuery.data;
  const equipment = equipmentQuery.data;

  const trimmedCompanyCode = companyCode.trim();
  const trimmedType = type.trim();
  const trimmedSubtype = subtype.trim();
  const trimmedNotes = notes.trim();

  const dirty =
    trimmedCompanyCode !== (equipment.companyCode ?? "") ||
    trimmedType !== (equipment.type ?? "") ||
    trimmedSubtype !== (equipment.subtype ?? "") ||
    mechanicalStatus !== (equipment.mechanicalStatus ?? "") ||
    toolStatus !== (equipment.toolStatus ?? "") ||
    trimmedNotes !== (equipment.notes ?? "");

  const saveDisabled = updateMutation.isPending || !dirty;

  const titleLabel =
    equipment.companyCode ?? equipment.type ?? "Equipment record";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium">{titleLabel}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Created by {equipment.createdByUserName ?? "—"} ·{" "}
            {new Date(equipment.createdAt).toLocaleString()}
          </p>
        </div>
        <Link
          href={`/o/${orgSlug}/equipment`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← All equipment
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
                id: equipment.id,
                organizationId: org.id,
                companyCode:
                  trimmedCompanyCode === "" ? null : trimmedCompanyCode,
                type: trimmedType === "" ? null : trimmedType,
                subtype: trimmedSubtype === "" ? null : trimmedSubtype,
                mechanicalStatus:
                  mechanicalStatus === "" ? null : mechanicalStatus,
                toolStatus: toolStatus === "" ? null : toolStatus,
                notes: trimmedNotes === "" ? null : trimmedNotes,
              });
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-companyCode`}>Company code</Label>
              <Input
                id={`${formId}-companyCode`}
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                disabled={updateMutation.isPending}
                maxLength={120}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-type`}>Type</Label>
              <Input
                id={`${formId}-type`}
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={updateMutation.isPending}
                maxLength={120}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${formId}-subtype`}>Subtype</Label>
              <Input
                id={`${formId}-subtype`}
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
                disabled={updateMutation.isPending}
                maxLength={120}
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
                disabled={updateMutation.isPending}
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
                disabled={updateMutation.isPending}
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
            Deleting this equipment record is permanent.
          </p>
          <div>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(`Delete ${titleLabel}? This cannot be undone.`)
                ) {
                  setError(null);
                  deleteMutation.mutate({
                    id: equipment.id,
                    organizationId: org.id,
                  });
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete equipment"}
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
