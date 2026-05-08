import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";
import { createOrganization } from "./create";
import { listOrganizationsForUser } from "./list";
import { listOrganizationsInputSchema, ORG_ROLE } from "./schemas";

describe("listOrganizationsForUser", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns only the user's own orgs with their role", async () => {
    const me = await makeUser("list-me");
    const stranger = await makeUser("list-stranger");
    const a = await createOrganization({
      name: `Mine A ${createId()}`,
      ownerUserId: me.id,
    });
    const b = await createOrganization({
      name: `Mine B ${createId()}`,
      ownerUserId: me.id,
    });
    await createOrganization({
      name: `Theirs ${createId()}`,
      ownerUserId: stranger.id,
    });

    const rows = await listOrganizationsForUser(
      me.id,
      listOrganizationsInputSchema.parse({}),
    );
    const ids = rows.map((r) => r.id).sort();
    expect(ids).toEqual([a.id, b.id].sort());
    for (const row of rows) {
      expect(row.role).toBe(ORG_ROLE.OWNER);
      expect(row.slug.length).toBeGreaterThan(0);
    }
  });

  test("filters by case-insensitive name search", async () => {
    const me = await makeUser("list-search");
    const slug = createId();
    const target = await createOrganization({
      name: `Findable Hatchery ${slug}`,
      ownerUserId: me.id,
    });
    await createOrganization({
      name: `Other Org ${slug}`,
      ownerUserId: me.id,
    });

    const rows = await listOrganizationsForUser(
      me.id,
      listOrganizationsInputSchema.parse({ search: "hatchery" }),
    );
    expect(rows.map((r) => r.id)).toEqual([target.id]);
  });

  test("respects limit and offset for pagination", async () => {
    const me = await makeUser("list-page");
    const created: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const row = await createOrganization({
        name: `Page ${i} ${createId()}`,
        ownerUserId: me.id,
      });
      created.push(row.id);
    }

    const firstTwo = await listOrganizationsForUser(
      me.id,
      listOrganizationsInputSchema.parse({ limit: 2, offset: 0 }),
    );
    expect(firstTwo).toHaveLength(2);
    const next = await listOrganizationsForUser(
      me.id,
      listOrganizationsInputSchema.parse({ limit: 2, offset: 2 }),
    );
    expect(next.length).toBeGreaterThanOrEqual(1);
  });
});
