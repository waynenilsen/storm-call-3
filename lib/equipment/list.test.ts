import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeEquipmentWithOrg } from "@/test/test-equipment";

import { prisma } from "../prisma";

import { createEquipment } from "./create";
import { listEquipmentInOrganization } from "./list";
import {
  listEquipmentInputSchema,
  MECHANICAL_STATUS,
  TOOL_STATUS,
} from "./schemas";

describe("listEquipmentInOrganization", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns only equipment for the requested organization", async () => {
    const { org, equipment } = await makeEquipmentWithOrg("eq-list-mine");
    const { org: otherOrg, equipment: otherEquipment } =
      await makeEquipmentWithOrg("eq-list-theirs");

    const rows = await listEquipmentInOrganization(
      listEquipmentInputSchema.parse({ organizationId: org.id }),
    );
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(equipment.id);
    expect(ids).not.toContain(otherEquipment.id);
    expect(otherOrg.id).not.toBe(org.id);
  });

  test("filters by case-insensitive search across companyCode/type/subtype/notes", async () => {
    const slug = createId();
    const { org, owner } = await makeEquipmentWithOrg("eq-list-search");
    const codeMatch = await createEquipment({
      organizationId: org.id,
      actingUserId: owner.id,
      companyCode: `QUARRY-${slug}`,
      type: "tool",
    });
    const notesMatch = await createEquipment({
      organizationId: org.id,
      actingUserId: owner.id,
      companyCode: `OTHER-${slug}`,
      type: "tool",
      notes: `pickaxe-${slug} inside`,
    });
    await createEquipment({
      organizationId: org.id,
      actingUserId: owner.id,
      companyCode: `NOISE-${slug}`,
      type: "tool",
      notes: `nothing here ${slug}`,
    });

    const byCode = await listEquipmentInOrganization(
      listEquipmentInputSchema.parse({
        organizationId: org.id,
        search: `quarry-${slug}`,
      }),
    );
    expect(byCode.map((r) => r.id)).toEqual([codeMatch.id]);

    const byNotes = await listEquipmentInOrganization(
      listEquipmentInputSchema.parse({
        organizationId: org.id,
        search: `pickaxe-${slug}`,
      }),
    );
    expect(byNotes.map((r) => r.id)).toEqual([notesMatch.id]);
  });

  test("filters by mechanicalStatus and toolStatus", async () => {
    const { org, owner } = await makeEquipmentWithOrg("eq-list-status");
    const opTooled = await createEquipment({
      organizationId: org.id,
      actingUserId: owner.id,
      companyCode: `OP-${createId()}`,
      mechanicalStatus: MECHANICAL_STATUS.OPERATIONAL,
      toolStatus: TOOL_STATUS.TOOLED,
    });
    const issuesPartial = await createEquipment({
      organizationId: org.id,
      actingUserId: owner.id,
      companyCode: `ISS-${createId()}`,
      mechanicalStatus: MECHANICAL_STATUS.ISSUES,
      toolStatus: TOOL_STATUS.PARTIALLY_TOOLED,
    });

    const operationalRows = await listEquipmentInOrganization(
      listEquipmentInputSchema.parse({
        organizationId: org.id,
        mechanicalStatus: MECHANICAL_STATUS.OPERATIONAL,
      }),
    );
    const operationalIds = operationalRows.map((r) => r.id);
    expect(operationalIds).toContain(opTooled.id);
    expect(operationalIds).not.toContain(issuesPartial.id);

    const partialRows = await listEquipmentInOrganization(
      listEquipmentInputSchema.parse({
        organizationId: org.id,
        toolStatus: TOOL_STATUS.PARTIALLY_TOOLED,
      }),
    );
    const partialIds = partialRows.map((r) => r.id);
    expect(partialIds).toContain(issuesPartial.id);
    expect(partialIds).not.toContain(opTooled.id);
  });

  test("respects limit and offset for pagination", async () => {
    const { org, owner } = await makeEquipmentWithOrg("eq-list-page");
    for (let i = 0; i < 3; i += 1) {
      await createEquipment({
        organizationId: org.id,
        actingUserId: owner.id,
        companyCode: `PAGE-${i}-${createId()}`,
      });
    }

    const firstTwo = await listEquipmentInOrganization(
      listEquipmentInputSchema.parse({
        organizationId: org.id,
        limit: 2,
        offset: 0,
      }),
    );
    expect(firstTwo).toHaveLength(2);
    const next = await listEquipmentInOrganization(
      listEquipmentInputSchema.parse({
        organizationId: org.id,
        limit: 2,
        offset: 2,
      }),
    );
    expect(next.length).toBeGreaterThanOrEqual(1);
  });
});
