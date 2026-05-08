import type { PrismaClient } from "@prisma/client";

import { recordActivity } from "../activity/record";
import { ACTIVITY_ACTION, RESOURCE_TYPE } from "../activity/schemas";
import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { slugify } from "../slugify";
import { allocateUniqueOrganizationSlug } from "./allocate-unique-org-slug";
import type { UpdateOrganizationInput } from "./schemas";

export async function updateOrganization(
  params: UpdateOrganizationInput & { actingUserId: string },
  tx?: PrismaTransaction,
) {
  const run = async (runner: PrismaTransaction | PrismaClient) => {
    const slug = await allocateUniqueOrganizationSlug(
      slugify(params.name),
      runner,
      { excludeOrganizationId: params.id },
    );
    const org = await runner.organization.update({
      where: { id: params.id },
      data: {
        name: params.name,
        slug,
        ...(params.url !== undefined ? { url: params.url } : {}),
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

    const changedFields: string[] = ["name"];
    if (params.url !== undefined) changedFields.push("url");

    await recordActivity(
      {
        organizationId: org.id,
        actorUserId: params.actingUserId,
        action: ACTIVITY_ACTION.ORGANIZATION_UPDATED,
        resourceType: RESOURCE_TYPE.ORGANIZATION,
        resourceId: org.id,
        resourceLabel: org.name,
        metadata: { changedFields },
      },
      runner as PrismaTransaction,
    );

    return org;
  };

  if (tx) return run(tx);
  return prisma.$transaction((inner) => run(inner));
}
