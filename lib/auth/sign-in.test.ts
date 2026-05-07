import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { prisma } from "../prisma";
import { signUpInputSchema } from "./schemas";
import { signIn } from "./sign-in";
import { signUp } from "./sign-up";

describe("signIn", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("succeeds with correct credentials", async () => {
    const slug = createId();
    const email = `signin-${slug}@example.test`;
    const password = "correct horse battery staple";
    const registered = await signUp(
      signUpInputSchema.parse({
        name: `Person ${slug}`,
        email,
        password,
      }),
    );
    expect(registered.created).toBe(true);
    if (!registered.created) {
      throw new Error("expected signup");
    }

    const result = await signIn({ email, password });
    expect(result).toMatchObject({
      ok: true,
      user: {
        id: registered.user.id,
        email,
        name: `Person ${slug}`,
      },
    });
    if (result.ok) {
      expect(result.user).not.toHaveProperty("passwordHash");
      expect(result.user.createdAt).toBeInstanceOf(Date);
    }
  });

  test("returns ok false for wrong password — same shape as unknown user", async () => {
    const slug = createId();
    const email = `signin-wrong-${slug}@example.test`;
    await signUp(
      signUpInputSchema.parse({
        name: `Who ${slug}`,
        email,
        password: "right-password12",
      }),
    );

    const badPassword = await signIn({ email, password: "wrong-password12" });
    const unknownUser = await signIn({
      email: `nobody-${slug}@example.test`,
      password: "any-password-here!!",
    });

    expect(badPassword).toEqual({ ok: false });
    expect(unknownUser).toEqual({ ok: false });
  });

  test("returns ok false for unknown email", async () => {
    const result = await signIn({
      email: `ghost-${createId()}@example.test`,
      password: "does-not-matter-much12",
    });
    expect(result).toEqual({ ok: false });
  });

  test("treats arbitrarily short password as credential mismatch, not validation error", async () => {
    const result = await signIn({
      email: `zod-${createId()}@example.test`,
      password: "short",
    });
    expect(result).toEqual({ ok: false });
  });

  test("duplicate signIn inside a transaction still allows further queries", async () => {
    const slug = createId();
    const email = `signin-tx-${slug}@example.test`;
    await signUp(
      signUpInputSchema.parse({
        name: `Tx User ${slug}`,
        email,
        password: "password12",
      }),
    );

    const ids = await prisma.$transaction(async (tx) => {
      const ok = await signIn({ email, password: "password12" }, tx);
      expect(ok.ok).toBe(true);
      const denied = await signIn({ email, password: "nope-password12" }, tx);
      expect(denied).toEqual({ ok: false });
      return tx.user.findMany({
        where: { email },
        select: { id: true },
      });
    });
    expect(ids.length).toBe(1);
  });
});
