"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useTRPC } from "@/lib/trpc/client";
import type { AppRouter } from "@/server/trpc/routers/_app";

type SessionUser = NonNullable<
  inferRouterOutputs<AppRouter>["auth"]["session"]
>;

export function DashboardShell({ user }: { user: SessionUser }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const signOutMutation = useMutation(
    trpc.auth.signOut.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.auth.session.queryFilter());
        router.replace("/");
      },
    }),
  );

  return (
    <SidebarProvider className="flex min-h-0 flex-1">
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
          <SidebarMenuButton
            className="px-2 text-left font-semibold"
            render={<Link href="/dashboard" />}
          >
            Placeholder app
          </SidebarMenuButton>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled aria-disabled>
                    Overview
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled aria-disabled>
                    Settings
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={signOutMutation.isPending}
            onClick={() => signOutMutation.mutate()}
          >
            {signOutMutation.isPending ? "Signing out…" : "Sign out"}
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm text-muted-foreground">
            Dashboard placeholder
          </span>
        </header>
        <main className="flex min-h-0 flex-1 flex-col p-6">
          <h1 className="text-lg font-medium">Hello, {user.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
