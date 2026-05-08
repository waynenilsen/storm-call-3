"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { OrgSwitcher } from "@/components/app/org-switcher";
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

type OrgBrief = Pick<
  inferRouterOutputs<AppRouter>["organizations"]["getBySlug"],
  "id" | "name" | "slug"
>;

export function OrgAppShell({
  user,
  org,
  children,
}: {
  user: SessionUser;
  org: OrgBrief;
  children: React.ReactNode;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const base = `/o/${org.slug}`;
  const navItems = [
    { href: base, label: "Overview" },
    { href: `${base}/employees`, label: "Employees" },
    { href: `${base}/settings`, label: "Organization" },
  ] as const;

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
        <SidebarHeader className="border-b border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <OrgSwitcher currentOrg={org} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const active =
                    item.href === base
                      ? pathname === item.href
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        render={<Link href={item.href} />}
                      >
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <div className="mb-2 px-2 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">{user.name}</div>
            <div className="truncate">{user.email}</div>
          </div>
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
          <span className="text-sm text-muted-foreground">{org.name}</span>
        </header>
        <main className="flex min-h-0 flex-1 flex-col p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
