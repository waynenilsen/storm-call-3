import { notFound } from "next/navigation";

import { OrgAppShell } from "@/components/app/org-app-shell";
import { requireSessionUserSsr } from "@/lib/auth/ssr-session";
import { getOrganizationForUserBySlug } from "@/lib/organizations/get-by-slug";
import { prisma } from "@/lib/prisma";

export default async function OrgSlugLayout(props: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await props.params;
  const user = await requireSessionUserSsr(`/o/${orgSlug}`);

  const org = await getOrganizationForUserBySlug({
    userId: user.id,
    slug: orgSlug,
  });
  if (!org) {
    notFound();
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { selectedOrganizationId: org.id },
  });

  return (
    <OrgAppShell
      user={user}
      org={{ id: org.id, name: org.name, slug: org.slug }}
    >
      {props.children}
    </OrgAppShell>
  );
}
