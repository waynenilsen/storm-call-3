import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeCalloutWithOrg } from "@/test/test-callout";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { CalloutNotInOrganizationError, updateCallout } from "./update";

describe("updateCallout", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("updates fields and refreshes updated-by audit metadata", async () => {
    const { org, owner, callout } = await makeCalloutWithOrg("co-upd");
    const editor = await makeUser("co-upd-editor");
    const slug = createId();
    const updated = await updateCallout({
      id: callout.id,
      organizationId: org.id,
      actingUserId: editor.id,
      name: `Renamed ${slug}`,
      messageText: `New body ${slug}`,
    });
    expect(updated.name).toBe(`Renamed ${slug}`);
    expect(updated.messageText).toBe(`New body ${slug}`);
    expect(updated.updatedByUserId).toBe(editor.id);
    expect(updated.updatedByUserName).toBe(editor.name);
    expect(updated.createdByUserId).toBe(owner.id);
  });

  test("supports partial updates that only touch one field", async () => {
    const { org, owner, callout } = await makeCalloutWithOrg("co-upd-partial");
    const slug = createId();
    const updated = await updateCallout({
      id: callout.id,
      organizationId: org.id,
      actingUserId: owner.id,
      messageText: `Body only ${slug}`,
    });
    expect(updated.name).toBe(callout.name);
    expect(updated.messageText).toBe(`Body only ${slug}`);
  });

  test("throws when the callout is not in the organization", async () => {
    const { callout } = await makeCalloutWithOrg("co-upd-bad-org");
    const stranger = await makeUser("co-upd-stranger");
    const otherOrg = await createOrganization({
      name: `Elsewhere ${createId()}`,
      ownerUserId: stranger.id,
    });
    await expect(
      updateCallout({
        id: callout.id,
        organizationId: otherOrg.id,
        actingUserId: stranger.id,
        name: "Nope",
      }),
    ).rejects.toBeInstanceOf(CalloutNotInOrganizationError);
  });
});
