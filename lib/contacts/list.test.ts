import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeContactWithOrg } from "@/test/test-contact";

import { prisma } from "../prisma";

import { createContact } from "./create";
import { listContactsInOrganization } from "./list";
import { listContactsInputSchema } from "./schemas";

describe("listContactsInOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns only contacts for the requested organization", async () => {
    const { org, contact } = await makeContactWithOrg("contact-list-mine");
    const { org: otherOrg, contact: otherContact } = await makeContactWithOrg(
      "contact-list-theirs",
    );

    const rows = await listContactsInOrganization(
      listContactsInputSchema.parse({ organizationId: org.id }),
    );
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(contact.id);
    expect(ids).not.toContain(otherContact.id);
    expect(otherOrg.id).not.toBe(org.id);
  });

  test("filters by case-insensitive match on name or email", async () => {
    const slug = createId();
    const { org, owner } = await makeContactWithOrg("contact-list-search");
    const target = await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Quarry Lead ${slug}`,
      email: `hidden-${slug}@inner.example.test`,
    });
    await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Noise Row ${slug}`,
      email: `noise-${slug}@example.test`,
    });

    const byName = await listContactsInOrganization(
      listContactsInputSchema.parse({
        organizationId: org.id,
        search: "quarry",
      }),
    );
    expect(byName.map((r) => r.id)).toEqual([target.id]);

    const byEmail = await listContactsInOrganization(
      listContactsInputSchema.parse({
        organizationId: org.id,
        search: "inner.example",
      }),
    );
    expect(byEmail.map((r) => r.id)).toEqual([target.id]);
  });

  test("matches phone via digits stripped from a formatted query", async () => {
    const slug = createId();
    const { org, owner } = await makeContactWithOrg("contact-list-phone");
    const target = await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Phone Match ${slug}`,
      phone: "(415) 555-0142",
    });
    await createContact({
      organizationId: org.id,
      actingUserId: owner.id,
      name: `Other Phone ${slug}`,
      phone: "+12125550000",
    });

    const formatted = await listContactsInOrganization(
      listContactsInputSchema.parse({
        organizationId: org.id,
        search: "(415) 555-0142",
      }),
    );
    expect(formatted.map((r) => r.id)).toEqual([target.id]);

    const partialDigits = await listContactsInOrganization(
      listContactsInputSchema.parse({
        organizationId: org.id,
        search: "5550142",
      }),
    );
    expect(partialDigits.map((r) => r.id)).toEqual([target.id]);
  });

  test("respects limit and offset for pagination", async () => {
    const { org, owner } = await makeContactWithOrg("contact-list-page");
    for (let i = 0; i < 3; i += 1) {
      await createContact({
        organizationId: org.id,
        actingUserId: owner.id,
        name: `Page Contact ${i} ${createId()}`,
      });
    }

    const firstTwo = await listContactsInOrganization(
      listContactsInputSchema.parse({
        organizationId: org.id,
        limit: 2,
        offset: 0,
      }),
    );
    expect(firstTwo).toHaveLength(2);
    const next = await listContactsInOrganization(
      listContactsInputSchema.parse({
        organizationId: org.id,
        limit: 2,
        offset: 2,
      }),
    );
    expect(next.length).toBeGreaterThanOrEqual(1);
  });
});
