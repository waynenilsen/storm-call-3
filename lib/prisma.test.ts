import { afterAll, describe, expect, test } from "bun:test";
import { prisma } from "./prisma";

describe("prisma TestItem (db smoke test)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("inserts and reads back a TestItem row", async () => {
    const name = `ci-smoke-${crypto.randomUUID()}`;

    const created = await prisma.testItem.create({ data: { name } });
    expect(created.id).toBeTruthy();
    expect(created.name).toBe(name);

    const found = await prisma.testItem.findUnique({
      where: { id: created.id },
    });
    expect(found?.name).toBe(name);
  });
});
