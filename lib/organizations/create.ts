import { createId } from "@paralleldrive/cuid2";
import type { PrismaClient } from "@prisma/client";
import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { slugify } from "../slugify";
import { allocateUniqueOrganizationSlug } from "./allocate-unique-org-slug";
import { type CreateOrganizationInput, ORG_ROLE } from "./schemas";

export async function createOrganization(
  params: CreateOrganizationInput & { ownerUserId: string },
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const orgId = createId();
    const slug = await allocateUniqueOrganizationSlug(
      slugify(params.name),
      runner,
    );
    const org = await runner.organization.create({
      data: {
        id: orgId,
        name: params.name,
        slug,
        url: params.url ?? null,
        memberships: {
          create: {
            id: createId(),
            userId: params.ownerUserId,
            role: ORG_ROLE.OWNER,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        url: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { ...org, role: ORG_ROLE.OWNER };
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
