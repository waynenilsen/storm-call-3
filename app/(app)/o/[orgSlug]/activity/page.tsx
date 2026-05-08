"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  ACTIVITY_ACTION,
  RESOURCE_TYPE,
  type ResourceType,
} from "@/lib/activity/schemas";
import { useTRPC } from "@/lib/trpc/client";

const PAGE_SIZE = 50;

const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  [RESOURCE_TYPE.CONTACT]: "Contact",
  [RESOURCE_TYPE.EQUIPMENT]: "Equipment",
  [RESOURCE_TYPE.CALLOUT]: "Callout",
  [RESOURCE_TYPE.CONVERSATION]: "Conversation",
  [RESOURCE_TYPE.MESSAGE]: "Message",
  [RESOURCE_TYPE.ORGANIZATION]: "Organization",
};

const ACTION_LABEL: Record<string, string> = {
  [ACTIVITY_ACTION.CONTACT_CREATED]: "Contact created",
  [ACTIVITY_ACTION.CONTACT_UPDATED]: "Contact updated",
  [ACTIVITY_ACTION.CONTACT_DELETED]: "Contact deleted",
  [ACTIVITY_ACTION.EQUIPMENT_CREATED]: "Equipment added",
  [ACTIVITY_ACTION.EQUIPMENT_UPDATED]: "Equipment updated",
  [ACTIVITY_ACTION.EQUIPMENT_DELETED]: "Equipment removed",
  [ACTIVITY_ACTION.CALLOUT_CREATED]: "Callout created",
  [ACTIVITY_ACTION.CALLOUT_UPDATED]: "Callout updated",
  [ACTIVITY_ACTION.CALLOUT_DELETED]: "Callout deleted",
  [ACTIVITY_ACTION.CONVERSATION_CREATED]: "Conversation started",
  [ACTIVITY_ACTION.MESSAGE_SENT_OUTBOUND]: "Message sent",
  [ACTIVITY_ACTION.ORGANIZATION_CREATED]: "Organization created",
  [ACTIVITY_ACTION.ORGANIZATION_UPDATED]: "Organization updated",
};

function actionLabel(action: string) {
  return ACTION_LABEL[action] ?? action;
}

function relativeTime(d: Date) {
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString();
}

function resourceHref(orgSlug: string, resourceType: string, id: string) {
  switch (resourceType) {
    case RESOURCE_TYPE.CONTACT:
      return `/o/${orgSlug}/contacts/${id}`;
    case RESOURCE_TYPE.EQUIPMENT:
      return `/o/${orgSlug}/equipment/${id}`;
    case RESOURCE_TYPE.CALLOUT:
      return `/o/${orgSlug}/callouts/${id}`;
    case RESOURCE_TYPE.CONVERSATION:
      return `/o/${orgSlug}/conversations/${id}`;
    default:
      return null;
  }
}

function metadataSummary(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  if (Array.isArray(m.changedFields) && m.changedFields.length > 0) {
    return `Changed: ${(m.changedFields as string[]).join(", ")}`;
  }
  return null;
}

export default function OrgActivityPage(props: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = use(props.params);
  const trpc = useTRPC();
  const filterId = useId();

  const [resourceType, setResourceType] = useState<"" | ResourceType>("");
  const [page, setPage] = useState(0);

  const orgQuery = useQuery(
    trpc.organizations.getBySlug.queryOptions({ slug: orgSlug }),
  );

  const activityQuery = useQuery(
    trpc.activity.list.queryOptions(
      orgQuery.data
        ? {
            organizationId: orgQuery.data.id,
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
            ...(resourceType ? { resourceType } : {}),
          }
        : skipToken,
    ),
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

  const rows = activityQuery.data ?? [];
  const hasMore = rows.length === PAGE_SIZE;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Audit log of changes across this organization.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Recent activity</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              id={`${filterId}-resource`}
              aria-label="Filter by resource"
              value={resourceType}
              onChange={(e) => {
                setResourceType(e.target.value as "" | ResourceType);
                setPage(0);
              }}
            >
              <NativeSelectOption value="">All resources</NativeSelectOption>
              {Object.values(RESOURCE_TYPE).map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {RESOURCE_TYPE_LABEL[value]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </CardHeader>
        <CardContent>
          {activityQuery.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : rows.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">When</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const href = resourceHref(
                      orgSlug,
                      row.resourceType,
                      row.resourceId,
                    );
                    const summary = metadataSummary(row.metadata);
                    return (
                      <TableRow key={row.id}>
                        <TableCell
                          className="text-xs text-muted-foreground"
                          title={new Date(row.createdAt).toLocaleString()}
                        >
                          {relativeTime(new Date(row.createdAt))}
                        </TableCell>
                        <TableCell>{row.actorUserName ?? "System"}</TableCell>
                        <TableCell>{actionLabel(row.action)}</TableCell>
                        <TableCell>
                          {href ? (
                            <Link
                              href={href}
                              className="underline-offset-4 hover:underline"
                            >
                              {row.resourceLabel ??
                                RESOURCE_TYPE_LABEL[
                                  row.resourceType as ResourceType
                                ] ??
                                row.resourceType}
                            </Link>
                          ) : (
                            (row.resourceLabel ??
                            RESOURCE_TYPE_LABEL[
                              row.resourceType as ResourceType
                            ] ??
                            row.resourceType)
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {summary ?? ""}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {page * PAGE_SIZE + 1}–
                  {page * PAGE_SIZE + rows.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!hasMore}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : resourceType ? (
            <p className="text-sm text-muted-foreground">
              No activity matches the current filter.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
