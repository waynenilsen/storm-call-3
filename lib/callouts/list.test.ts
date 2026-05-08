import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeCalloutWithOrg } from "@/test/test-callout";

import { prisma } from "../prisma";

import { createCallout } from "./create";
import { listCalloutsInOrganization } from "./list";
import { listCalloutsInputSchema } from "./schemas";

describe("listCalloutsInOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns only callouts for the requested organization", async () => {
    const { org, callout } = await makeCalloutWithOrg("co-list-mine");
    const { org: otherOrg, callout: otherCallout } =
      await makeCalloutWithOrg("co-list-theirs");

    const rows = await listCalloutsInOrganization(
      listCalloutsInputSchema.parse({ organizationId: org.id }),
    );
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(callout.id);
    expect(ids).not.toContain(otherCallout.id);
    expect(otherOrg.id).not.toBe(org.id);
  });

  test("filters by case-insensitive search across name and messageText", async () => {
    const slug = createId();
    const { org, owner } = await makeCalloutWithOrg("co-list-search");
    const target = await createCallout({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Quarry ${slug}`,
      messageText: `unrelated body ${slug}`,
    });
    const bodyMatch = await createCallout({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Different ${slug}`,
      messageText: `pickaxe-${slug} inside`,
    });
    await createCallout({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Noise ${slug}`,
      messageText: `nothing here ${slug}`,
    });

    const byName = await listCalloutsInOrganization(
      listCalloutsInputSchema.parse({
        organizationId: org.id,
        search: "quarry",
      }),
    );
    expect(byName.map((r) => r.id)).toEqual([target.id]);

    const byBody = await listCalloutsInOrganization(
      listCalloutsInputSchema.parse({
        organizationId: org.id,
        search: `pickaxe-${slug}`,
      }),
    );
    expect(byBody.map((r) => r.id)).toEqual([bodyMatch.id]);
  });

  test("respects limit and offset for pagination", async () => {
    const { org, owner } = await makeCalloutWithOrg("co-list-page");
    for (let i = 0; i < 3; i += 1) {
      await createCallout({
        organizationId: org.id,
        actingUserId: owner.id,
        name: `Page ${i} ${createId()}`,
        messageText: `body ${i}`,
      });
    }

    const firstTwo = await listCalloutsInOrganization(
      listCalloutsInputSchema.parse({
        organizationId: org.id,
        limit: 2,
        offset: 0,
      }),
    );
    expect(firstTwo).toHaveLength(2);
    const next = await listCalloutsInOrganization(
      listCalloutsInputSchema.parse({
        organizationId: org.id,
        limit: 2,
        offset: 2,
      }),
    );
    expect(next.length).toBeGreaterThanOrEqual(1);
  });
});
