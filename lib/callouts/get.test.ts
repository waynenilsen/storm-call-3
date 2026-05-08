import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";
import { makeCalloutWithOrg } from "@/test/test-callout";
import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";

import { getCalloutInOrganization } from "./get";

describe("getCalloutInOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns the callout when id matches organization", async () => {
    const { org, callout } = await makeCalloutWithOrg("co-get-hit");
    const result = await getCalloutInOrganization({
      id: callout.id,
      organizationId: org.id,
    });
    expect(result?.id).toBe(callout.id);
    expect(result?.messageText).toBe(callout.messageText);
  });

  test("returns null when the callout belongs to another organization", async () => {
    const { callout } = await makeCalloutWithOrg("co-get-wrong-org");
    const stranger = await makeUser("co-get-stranger");
    const otherOrg = await createOrganization({
      name: `Other ${createId()}`,
      ownerUserId: stranger.id,
    });
    const result = await getCalloutInOrganization({
      id: callout.id,
      organizationId: otherOrg.id,
    });
    expect(result).toBeNull();
  });

  test("returns null for an unknown callout id", async () => {
    const { org } = await makeCalloutWithOrg("co-get-missing");
    const result = await getCalloutInOrganization({
      id: createId(),
      organizationId: org.id,
    });
    expect(result).toBeNull();
  });
});
