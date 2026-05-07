import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";

import { prisma } from "../prisma";
import { signUp, signUpInputSchema } from "./sign-up";

describe("signUp", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("creates User with bcrypt password hash", async () => {
    const slug = createId();
    const email = `signup-${slug}@example.test`;
    const result = await signUp(
      signUpInputSchema.parse({
        name: `Test User ${slug}`,
        email,
        password: "correct horse battery staple",
      }),
    );
    expect(result.created).toBe(true);
    if (!result.created) {
      throw new Error("expected created user");
    }
    const { user } = result;
    expect(user.id.length).toBeGreaterThan(0);
    expect(user.email).toBe(email);
    expect(user).not.toHaveProperty("passwordHash");

    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    expect(stored.passwordHash).not.toContain("correct");
    await expect(
      Bun.password.verify("correct horse battery staple", stored.passwordHash),
    ).resolves.toBe(true);
  });

  test("normalizes email to lowercase", async () => {
    const slug = createId();
    const out = await signUp(
      signUpInputSchema.parse({
        name: `Lowercase ${slug}`,
        email: `MiXeD-${slug}@Example.TEST`,
        password: "password12",
      }),
    );
    expect(out.created).toBe(true);
    const row = await prisma.user.findUnique({
      where: { email: `mixed-${slug}@example.test` },
    });
    expect(row).not.toBeNull();
  });

  test("returns created: false on duplicate email without distinct error type", async () => {
    const slug = createId();
    const email = `dup-${slug}@example.test`;
    const first = await signUp(
      signUpInputSchema.parse({
        name: "First",
        email,
        password: "password12",
      }),
    );
    expect(first.created).toBe(true);
    const second = await signUp(
      signUpInputSchema.parse({
        name: "Second",
        email,
        password: "password12",
      }),
    );
    expect(second).toEqual({ created: false });
  });

  test("duplicate inside a transaction does not poison the tx", async () => {
    const slug = createId();
    const email = `tx-dup-${slug}@example.test`;
    const first = await signUp(
      signUpInputSchema.parse({
        name: "First",
        email,
        password: "password12",
      }),
    );
    expect(first.created).toBe(true);

    const count = await prisma.$transaction(async (tx) => {
      const dup = await signUp(
        signUpInputSchema.parse({
          name: "Second",
          email,
          password: "password12",
        }),
        tx,
      );
      expect(dup).toEqual({ created: false });
      return await tx.user.count({ where: { email } });
    });
    expect(count).toBe(1);
  });

  test("concurrent signUps for the same email — exactly one wins", async () => {
    const slug = createId();
    const email = `race-${slug}@example.test`;
    const results = await Promise.all([
      signUp(
        signUpInputSchema.parse({ name: "A", email, password: "password12" }),
      ),
      signUp(
        signUpInputSchema.parse({ name: "B", email, password: "password12" }),
      ),
      signUp(
        signUpInputSchema.parse({ name: "C", email, password: "password12" }),
      ),
    ]);
    const wins = results.filter((r) => r.created).length;
    expect(wins).toBe(1);
    const rowCount = await prisma.user.count({ where: { email } });
    expect(rowCount).toBe(1);
  });

  test("rejects short password at schema boundary with ZodError", () => {
    const parsed = signUpInputSchema.safeParse({
      name: "X",
      email: `bad-${createId()}@example.test`,
      password: "short",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      throw new Error("unexpected");
    }
    expect(parsed.error).toBeInstanceOf(z.ZodError);
  });
});
