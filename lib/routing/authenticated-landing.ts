import { prisma } from "../prisma";

/**
 * Where an authenticated user should land: `/welcome` if they have no orgs,
 * otherwise `/o/{slug}` using selection rules (single org, valid selected, or
 * first slug lexicographically). Persists `selectedOrganizationId` when inferred.
 */
export async function resolveAuthenticatedLandingPath(userId: string) {
  const orgs = await prisma.organization.findMany({
    where: { memberships: { some: { userId } } },
    select: { id: true, slug: true },
    orderBy: { slug: "asc" },
  });

  if (orgs.length === 0) {
    return "/welcome" as const;
  }

  if (orgs.length === 1) {
    const only = orgs[0];
    await prisma.user.update({
      where: { id: userId },
      data: { selectedOrganizationId: only.id },
    });
    return `/o/${only.slug}` as const;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { selectedOrganizationId: true },
  });

  const selected = orgs.find((o) => o.id === user?.selectedOrganizationId);
  if (selected) {
    return `/o/${selected.slug}` as const;
  }

  const first = orgs[0];
  await prisma.user.update({
    where: { id: userId },
    data: { selectedOrganizationId: first.id },
  });
  return `/o/${first.slug}` as const;
}
