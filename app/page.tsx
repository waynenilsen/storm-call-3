"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, Radio, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc/client";

export default function Home() {
  const trpc = useTRPC();
  const timeQuery = useQuery(
    trpc.time.queryOptions(undefined, {
      refetchInterval: 1000,
      refetchIntervalInBackground: true,
    }),
  );

  const now = timeQuery.data?.now;
  const isLive = timeQuery.status === "success" && !timeQuery.isError;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <CardTitle>Polling clock</CardTitle>
            <Badge variant={isLive ? "default" : "secondary"} className="ml-2">
              {isLive ? (
                <Wifi className="size-3" />
              ) : (
                <WifiOff className="size-3" />
              )}
              {isLive ? "live" : timeQuery.status}
            </Badge>
          </div>
          <CardDescription>
            tRPC v11 procedure <code className="font-mono">time</code>{" "}
            re-fetched every <span className="font-mono">1000ms</span> via
            TanStack Query. The wire payload is superjson-encoded so{" "}
            <code className="font-mono">now</code> is a real{" "}
            <code className="font-mono">Date</code> on the client.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/40 py-10">
            {now ? (
              <span className="font-mono text-5xl font-semibold tracking-tight tabular-nums">
                {now.toLocaleTimeString()}
              </span>
            ) : (
              <Skeleton className="h-12 w-56" />
            )}
            <span className="mt-2 text-xs text-muted-foreground font-mono">
              {now?.toDateString() ?? " "}
            </span>
          </div>

          <Separator />

          <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">ISO</dt>
            <dd className="font-mono break-all">
              {now?.toISOString() ?? <Skeleton className="h-4 w-64" />}
            </dd>

            <dt className="text-muted-foreground">runtime type</dt>
            <dd>
              {now ? (
                <Badge
                  variant={now instanceof Date ? "default" : "destructive"}
                >
                  {now instanceof Date ? "Date (superjson)" : typeof now}
                </Badge>
              ) : (
                <Skeleton className="h-5 w-24" />
              )}
            </dd>

            <dt className="text-muted-foreground">status</dt>
            <dd>
              <Badge variant="outline" className="font-mono">
                {timeQuery.status}
              </Badge>
            </dd>

            <dt className="text-muted-foreground">fetching</dt>
            <dd className="flex items-center gap-2">
              <Radio
                className={
                  timeQuery.isFetching
                    ? "size-3.5 animate-pulse text-emerald-500"
                    : "size-3.5 text-muted-foreground/40"
                }
              />
              <span className="font-mono text-xs text-muted-foreground">
                {timeQuery.isFetching ? "in flight" : "idle"}
              </span>
            </dd>

            <dt className="text-muted-foreground">last update</dt>
            <dd className="font-mono text-xs text-muted-foreground">
              {timeQuery.dataUpdatedAt
                ? new Date(timeQuery.dataUpdatedAt).toLocaleTimeString(
                    undefined,
                    {
                      hour12: false,
                    },
                  )
                : "—"}
            </dd>
          </dl>
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          GET /api/trpc/time · refetchInterval: 1000ms ·
          refetchIntervalInBackground: true
        </CardFooter>
      </Card>
    </main>
  );
}
