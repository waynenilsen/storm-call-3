import type { PrismaClient } from "@prisma/client";

import type { PrismaTransaction } from "../prisma";

const MAX_SLUG_LENGTH = 100;

/** Picks `base`, `base-2`, `base-3`, … globally unique among organizations. */
export async function allocateUniqueOrganizationSlug(
  preferredBaseSlug: string,
  db: PrismaTransaction | PrismaClient,
  options?: { excludeOrganizationId?: string },
): Promise<string> {
  const baseStem = (
    preferredBaseSlug.length > 0 ? preferredBaseSlug : "organization"
  ).slice(0, MAX_SLUG_LENGTH);

  let counter = 0;
  while (counter <= 10_000) {
    const suffix = counter === 0 ? "" : `-${counter + 1}`;
    const room = Math.max(1, MAX_SLUG_LENGTH - suffix.length);
    const stem = baseStem.slice(0, room);
    const candidate = `${stem}${suffix}`;

    const conflict = await db.organization.findFirst({
      where: {
        slug: candidate,
        ...(options?.excludeOrganizationId
          ? { NOT: { id: options.excludeOrganizationId } }
          : {}),
      },
      select: { id: true },
    });

    if (!conflict) return candidate;
    counter += 1;
  }

  throw new Error("could not allocate unique organization slug");
}
