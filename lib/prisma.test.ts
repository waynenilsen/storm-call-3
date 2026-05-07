import { describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";
import { withIsolatedPrisma } from "@/test/isolated-prisma";

describe("prisma TestItem (db, parallel-safe)", () => {
  test("inserts and reads back a TestItem row", async () => {
    await withIsolatedPrisma(async (prisma) => {
      const name = `ci-smoke-${createId()}`;

      const created = await prisma.testItem.create({ data: { name } });
      expect(created.id).toBeTruthy();
      expect(created.name).toBe(name);

      const found = await prisma.testItem.findUnique({
        where: { id: created.id },
      });
      expect(found?.name).toBe(name);
    });
  });

  test("each test gets an empty clone (parallel-safe isolation)", async () => {
    await withIsolatedPrisma(async (prisma) => {
      expect(await prisma.testItem.count()).toBe(0);
      await prisma.testItem.create({
        data: { name: `parallel-${createId()}` },
      });
      expect(await prisma.testItem.count()).toBe(1);
    });
  });

  test("second empty-clone check (run in parallel with others)", async () => {
    await withIsolatedPrisma(async (prisma) => {
      expect(await prisma.testItem.count()).toBe(0);
    });
  });
});
