import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeContactWithOrg } from "@/test/test-contact";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { deleteContact } from "./delete";

describe("deleteContact", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("removes the row when id and organization match", async () => {
    const { org, contact } = await makeContactWithOrg("contact-del-ok");
    await expect(
      deleteContact({ id: contact.id, organizationId: org.id }),
    ).resolves.toEqual({ ok: true });

    const row = await prisma.contact.findUnique({
      where: { id: contact.id },
    });
    expect(row).toBeNull();
  });

  test("returns ok false and leaves the row when organization does not match", async () => {
    const { contact } = await makeContactWithOrg("contact-del-scope");
    const stranger = await makeUser("contact-del-stranger");
    const otherOrg = await createOrganization({
      name: `Other ${createId()}`,
      ownerUserId: stranger.id,
    });
    const result = await deleteContact({
      id: contact.id,
      organizationId: otherOrg.id,
    });
    expect(result).toEqual({ ok: false });

    const row = await prisma.contact.findUnique({
      where: { id: contact.id },
    });
    expect(row).not.toBeNull();
  });
});
