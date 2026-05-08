import { createOrganization } from "@/lib/organizations/create";
import { ORG_ROLE } from "@/lib/organizations/schemas";
import { prisma } from "@/lib/prisma";

export const SEED_ORG_NAME = "Storm Call Dev Org";

/**
 * Idempotent: re-uses the first org where the seed user is OWNER. Picking by
 * role rather than by name avoids dupes if someone renamed it through the UI.
 */
export async function findOrCreateSeedOrg(ownerUserId: string) {
  const existing = await prisma.userOrganization.findFirst({
    where: { userId: ownerUserId, role: ORG_ROLE.OWNER },
    select: {
      organization: {
        select: { id: true, name: true, slug: true, url: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return { ...existing.organization, created: false as const };

  const org = await createOrganization({
    name: SEED_ORG_NAME,
    ownerUserId,
  });
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    url: org.url,
    created: true as const,
  };
}
