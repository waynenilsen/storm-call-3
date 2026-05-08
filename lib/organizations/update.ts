import type { PrismaClient } from "@prisma/client";
import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { slugify } from "../slugify";
import { allocateUniqueOrganizationSlug } from "./allocate-unique-org-slug";
import type { UpdateOrganizationInput } from "./schemas";

export async function updateOrganization(
  params: UpdateOrganizationInput,
  db: PrismaTransaction | PrismaClient = prisma,
) {
  const slug = await allocateUniqueOrganizationSlug(slugify(params.name), db, {
    excludeOrganizationId: params.id,
  });
  return db.organization.update({
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
}
