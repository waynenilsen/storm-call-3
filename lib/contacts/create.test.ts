import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { ACTIVITY_ACTION, RESOURCE_TYPE } from "@/lib/activity/schemas";
import { getConversationByContactId } from "@/lib/conversations/get";
import { createOrganization } from "@/lib/organizations/create";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { createContact } from "./create";
import { InvalidContactPhoneError } from "./phone-us";

describe("createContact", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("stores row under organization with audit fields from the acting user", async () => {
    const slug = createId();
    const owner = await makeUser(`contact-create-owner-${slug}`);
    const org = await createOrganization({
      name: `Org For Contact ${slug}`,
      ownerUserId: owner.id,
    });
    const contact = await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Pat Example ${slug}`,
      email: `pat-${slug}@example.test`,
      phone: "+12025551999",
    });

    expect(contact.organizationId).toBe(org.id);
    expect(contact.name).toBe(`Pat Example ${slug}`);
    expect(contact.email).toBe(`pat-${slug}@example.test`);
    expect(contact.phone).toBe("+12025551999");
    expect(contact.createdByUserId).toBe(owner.id);
    expect(contact.updatedByUserId).toBe(owner.id);
    expect(contact.createdByUserName).toBe(owner.name);
    expect(contact.updatedByUserName).toBe(owner.name);

    const row = await prisma.contact.findUniqueOrThrow({
      where: { id: contact.id },
      select: { organizationId: true },
    });
    expect(row.organizationId).toBe(org.id);

    // Empty conversation is paired 1:1 with the contact on creation.
    const conversation = await getConversationByContactId({
      contactId: contact.id,
      organizationId: org.id,
    });
    expect(conversation).not.toBeNull();
    expect(conversation?.organizationId).toBe(org.id);
    expect(conversation?.messageCount).toBe(0);
    expect(conversation?.unreadCount).toBe(0);
    expect(conversation?.lastMessageAt).toBeNull();

    const activity = await prisma.activity.findFirstOrThrow({
      where: {
        organizationId: org.id,
        resourceId: contact.id,
        action: ACTIVITY_ACTION.CONTACT_CREATED,
      },
    });
    expect(activity.resourceType).toBe(RESOURCE_TYPE.CONTACT);
    expect(activity.actorUserId).toBe(owner.id);
    expect(activity.actorUserName).toBe(owner.name);
    expect(activity.resourceLabel).toBe(contact.name);
  });

  test("normalizes US-local formatted phone to E.164 on create", async () => {
    const slug = createId();
    const owner = await makeUser(`contact-phone-fmt-${slug}`);
    const org = await createOrganization({
      name: `Org Phone ${slug}`,
      ownerUserId: owner.id,
    });
    const contact = await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Phone User ${slug}`,
      phone: "(206) 555-0199",
    });
    expect(contact.phone).toBe("+12065550199");
  });

  test("rejects phone numbers libphonenumber cannot parse as valid US", async () => {
    const owner = await makeUser("contact-bad-phone");
    const org = await createOrganization({
      name: `Org Bad Phone ${createId()}`,
      ownerUserId: owner.id,
    });
    await expect(
      createContact({
        organizationId: org.id,
        actingUserId: owner.id,
        phone: "totally not a number",
      }),
    ).rejects.toBeInstanceOf(InvalidContactPhoneError);
  });

  test("allows a minimal row with only organization and actor", async () => {
    const owner = await makeUser("contact-minimal");
    const org = await createOrganization({
      name: `Bare Org ${createId()}`,
      ownerUserId: owner.id,
    });
    const contact = await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
    });
    expect(contact.name).toBeNull();
    expect(contact.email).toBeNull();
    expect(contact.phone).toBeNull();
    expect(contact.id.length).toBeGreaterThan(0);
  });
});
