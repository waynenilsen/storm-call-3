import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { ACTIVITY_ACTION } from "@/lib/activity/schemas";
import { createOrganization } from "@/lib/organizations/create";
import { makeContactWithOrg } from "@/test/test-contact";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { ContactNotInOrganizationError, updateContact } from "./update";

describe("updateContact", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("updates fields and refreshes updated-by audit metadata", async () => {
    const { org, owner, contact } = await makeContactWithOrg("contact-upd");
    const editor = await makeUser("contact-upd-editor");
    const slug = createId();
    const updated = await updateContact({
      id: contact.id,
      organizationId: org.id,
      actingUserId: editor.id,
      name: `Renamed ${slug}`,
      email: `renamed-${slug}@example.test`,
    });
    expect(updated.name).toBe(`Renamed ${slug}`);
    expect(updated.email).toBe(`renamed-${slug}@example.test`);
    expect(updated.updatedByUserId).toBe(editor.id);
    expect(updated.updatedByUserName).toBe(editor.name);
    expect(updated.createdByUserId).toBe(owner.id);

    const activity = await prisma.activity.findFirstOrThrow({
      where: {
        organizationId: org.id,
        resourceId: contact.id,
        action: ACTIVITY_ACTION.CONTACT_UPDATED,
      },
    });
    expect(activity.actorUserId).toBe(editor.id);
    expect(activity.metadata).toEqual({
      changedFields: ["name", "email"],
    });
  });

  test("normalizes US phone on update", async () => {
    const { org, owner, contact } =
      await makeContactWithOrg("contact-upd-phone");
    const updated = await updateContact({
      id: contact.id,
      organizationId: org.id,
      actingUserId: owner.id,
      phone: "(206) 555-0199",
    });
    expect(updated.phone).toBe("+12065550199");
  });

  test("throws when the contact is not in the organization", async () => {
    const { contact } = await makeContactWithOrg("contact-upd-bad-org");
    const stranger = await makeUser("contact-upd-stranger");
    const otherOrg = await createOrganization({
      name: `Elsewhere ${createId()}`,
      ownerUserId: stranger.id,
    });
    await expect(
      updateContact({
        id: contact.id,
        organizationId: otherOrg.id,
        actingUserId: stranger.id,
        name: "Nope",
      }),
    ).rejects.toBeInstanceOf(ContactNotInOrganizationError);
  });
});
