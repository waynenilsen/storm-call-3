import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";
import { createOrganization } from "./create";
import { updateOrganization } from "./update";

describe("updateOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("renames an organization", async () => {
    const me = await makeUser("update-rename");
    const org = await createOrganization({
      name: `Before ${createId()}`,
      ownerUserId: me.id,
    });
    const slug = createId();
    const renamed = await updateOrganization({
      id: org.id,
      name: `After ${slug}`,
    });
    expect(renamed.name).toBe(`After ${slug}`);

    const stored = await prisma.organization.findUniqueOrThrow({
      where: { id: org.id },
      select: { name: true },
    });
    expect(stored.name).toBe(`After ${slug}`);
  });
});
