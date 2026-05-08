"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useTRPC } from "@/lib/trpc/client";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function OrgSwitcher({
  currentOrg,
}: {
  currentOrg: { id: string; name: string; slug: string };
}) {
  const trpc = useTRPC();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const orgsQuery = useQuery(
    trpc.organizations.list.queryOptions({ limit: 50, offset: 0 }),
  );

  const orgs = orgsQuery.data ?? [
    { id: currentOrg.id, name: currentOrg.name, slug: currentOrg.slug },
  ];

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <SidebarMenuButton
              size="lg"
              aria-label="Switch organization"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            />
          }
        >
          <Avatar data-size="sm" className="rounded-md">
            <AvatarFallback className="rounded-md bg-primary text-primary-foreground">
              {getInitials(currentOrg.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col text-left leading-tight">
            <span className="truncate text-sm font-semibold">
              {currentOrg.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {currentOrg.slug}
            </span>
          </div>
          <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-(--anchor-width) min-w-64 p-0"
        >
          <Command>
            <CommandInput placeholder="Search organizations…" />
            <CommandList>
              <CommandEmpty>No organizations found.</CommandEmpty>
              <CommandGroup heading="Organizations">
                {orgs.map((org) => {
                  const isCurrent = org.id === currentOrg.id;
                  return (
                    <CommandItem
                      key={org.id}
                      value={`${org.name} ${org.slug}`}
                      data-checked={isCurrent}
                      onSelect={() => {
                        setOpen(false);
                        if (!isCurrent) router.push(`/o/${org.slug}`);
                      }}
                    >
                      <Avatar data-size="sm" className="rounded-md">
                        <AvatarFallback className="rounded-md bg-muted text-xs">
                          {getInitials(org.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col leading-tight">
                        <span className="truncate font-medium">{org.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {org.slug}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  value="__create_organization__"
                  onSelect={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border border-dashed">
                    <PlusIcon className="size-3.5" />
                  </div>
                  <span className="font-medium">Create organization</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <CreateOrganizationDialog
        showTrigger={false}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
}
