import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { prisma } from "../prisma";
import { signOutInputSchema, signUpInputSchema } from "./schemas";
import { hashSessionToken } from "./session";
import { signOut } from "./sign-out";
import { signUp } from "./sign-up";

describe("signOut", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("revokes an active session", async () => {
    const slug = createId();
    const registered = await signUp(
      signUpInputSchema.parse({
        name: `Out ${slug}`,
        email: `signout-${slug}@example.test`,
        password: "password12abcd",
      }),
    );
    expect(registered.created).toBe(true);
    if (!registered.created) {
      throw new Error("expected signup");
    }

    const { token } = registered.session;
    const out = await signOut(signOutInputSchema.parse({ token }));
    expect(out).toEqual({ ok: true });

    const row = await prisma.session.findUniqueOrThrow({
      where: { tokenHash: hashSessionToken(token) },
      select: { revokedAt: true, expiresAt: true },
    });
    expect(row.revokedAt).not.toBeNull();
    expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  test("is idempotent after already revoked", async () => {
    const slug = createId();
    const registered = await signUp(
      signUpInputSchema.parse({
        name: `Again ${slug}`,
        email: `signout-again-${slug}@example.test`,
        password: "password12abcd",
      }),
    );
    expect(registered.created).toBe(true);
    if (!registered.created) {
      throw new Error("expected signup");
    }

    await expect(
      signOut(signOutInputSchema.parse({ token: registered.session.token })),
    ).resolves.toEqual({ ok: true });
    await expect(
      signOut(signOutInputSchema.parse({ token: registered.session.token })),
    ).resolves.toEqual({ ok: true });
  });

  test("returns ok false for unknown token", async () => {
    const fake = Buffer.from(
      crypto.getRandomValues(new Uint8Array(32)),
    ).toString("base64url");
    await expect(
      signOut(signOutInputSchema.parse({ token: fake })),
    ).resolves.toEqual({ ok: false });
  });

  test("treats expired session as already signed out (ok true)", async () => {
    const slug = createId();
    const registered = await signUp(
      signUpInputSchema.parse({
        name: `Exp ${slug}`,
        email: `signout-exp-${slug}@example.test`,
        password: "password12abcd",
      }),
    );
    expect(registered.created).toBe(true);
    if (!registered.created) {
      throw new Error("expected signup");
    }

    const tokenHash = hashSessionToken(registered.session.token);
    await prisma.session.update({
      where: { tokenHash },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    await expect(
      signOut(signOutInputSchema.parse({ token: registered.session.token })),
    ).resolves.toEqual({ ok: true });
  });

  test("does not poison outer transaction on unknown token", async () => {
    const slug = createId();
    const email = `signout-tx-${slug}@example.test`;
    const registered = await signUp(
      signUpInputSchema.parse({
        name: `Tx ${slug}`,
        email,
        password: "password12abcd",
      }),
    );
    expect(registered.created).toBe(true);
    if (!registered.created) {
      throw new Error("expected signup");
    }

    const rows = await prisma.$transaction(async (tx) => {
      const denied = await signOut(
        signOutInputSchema.parse({
          token: Buffer.from(
            crypto.getRandomValues(new Uint8Array(32)),
          ).toString("base64url"),
        }),
        tx,
      );
      expect(denied).toEqual({ ok: false });
      return tx.user.findMany({ where: { email }, select: { id: true } });
    });
    expect(rows).toHaveLength(1);
  });
});
