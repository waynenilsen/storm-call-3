import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeOrganizationWithOwner } from "@/test/test-org";

import { prisma } from "../prisma";

import { listActivitiesInOrganization } from "./list";
import { recordActivity } from "./record";
import { ACTIVITY_ACTION, RESOURCE_TYPE } from "./schemas";

async function seed(orgId: string, ownerId: string) {
  const ids = {
    contact: createId(),
    equipment: createId(),
    callout: createId(),
  };
  await prisma.$transaction(async (tx) => {
    await recordActivity(
      {
        organizationId: orgId,
        actorUserId: ownerId,
        action: ACTIVITY_ACTION.CONTACT_CREATED,
        resourceType: RESOURCE_TYPE.CONTACT,
        resourceId: ids.contact,
        resourceLabel: "Contact A",
      },
      tx,
    );
    await recordActivity(
      {
        organizationId: orgId,
        actorUserId: ownerId,
        action: ACTIVITY_ACTION.EQUIPMENT_CREATED,
        resourceType: RESOURCE_TYPE.EQUIPMENT,
        resourceId: ids.equipment,
        resourceLabel: "EQ-1",
      },
      tx,
    );
    await recordActivity(
      {
        organizationId: orgId,
        actorUserId: null,
        action: ACTIVITY_ACTION.CALLOUT_CREATED,
        resourceType: RESOURCE_TYPE.CALLOUT,
        resourceId: ids.callout,
        resourceLabel: "Callout 1",
      },
      tx,
    );
  });
  return ids;
}

describe("listActivitiesInOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns activities scoped to the organization in newest-first order", async () => {
    const { owner, org } = await makeOrganizationWithOwner("act-list-scope");
    await seed(org.id, owner.id);

    const rows = await listActivitiesInOrganization({
      organizationId: org.id,
      limit: 50,
      offset: 0,
    });
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const row of rows) {
      expect(row.organizationId).toBe(org.id);
    }
    const sortedDesc = [...rows].every(
      (row, idx, arr) =>
        idx === 0 ||
        (arr[idx - 1] as (typeof rows)[number]).createdAt.getTime() >=
          row.createdAt.getTime(),
    );
    expect(sortedDesc).toBe(true);
  });

  test("filters by resourceType", async () => {
    const { owner, org } = await makeOrganizationWithOwner("act-list-type");
    const ids = await seed(org.id, owner.id);

    const rows = await listActivitiesInOrganization({
      organizationId: org.id,
      resourceType: RESOURCE_TYPE.EQUIPMENT,
      limit: 50,
      offset: 0,
    });
    expect(rows.map((r) => r.resourceId)).toEqual([ids.equipment]);
  });

  test("filters by actorUserId", async () => {
    const { owner, org } = await makeOrganizationWithOwner("act-list-actor");
    await seed(org.id, owner.id);

    const rows = await listActivitiesInOrganization({
      organizationId: org.id,
      actorUserId: owner.id,
      limit: 50,
      offset: 0,
    });
    for (const row of rows) {
      expect(row.actorUserId).toBe(owner.id);
    }
  });

  test("paginates with limit and offset", async () => {
    const { owner, org } = await makeOrganizationWithOwner("act-list-page");
    await seed(org.id, owner.id);

    const page1 = await listActivitiesInOrganization({
      organizationId: org.id,
      limit: 2,
      offset: 0,
    });
    const page2 = await listActivitiesInOrganization({
      organizationId: org.id,
      limit: 2,
      offset: 2,
    });
    expect(page1.length).toBe(2);
    expect(page2.length).toBeGreaterThanOrEqual(1);
    const overlapping = page1.some((p1) => page2.some((p2) => p2.id === p1.id));
    expect(overlapping).toBe(false);
  });
});
