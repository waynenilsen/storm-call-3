import { afterAll, describe, expect, test } from "bun:test";

import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";
import {
  createPasswordResetToken,
  hashResetToken,
  PASSWORD_RESET_TTL_MS,
} from "./password-reset-token";

describe("createPasswordResetToken", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("persists hash, returns plaintext, sets ~1h expiry", async () => {
    const user = await makeUser("prt-basic");
    const before = Date.now();

    const { token, expiresAt } = await createPasswordResetToken({
      userId: user.id,
    });

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const ttl = expiresAt.getTime() - before;
    expect(ttl).toBeGreaterThanOrEqual(PASSWORD_RESET_TTL_MS - 1000);
    expect(ttl).toBeLessThanOrEqual(PASSWORD_RESET_TTL_MS + 5000);

    const row = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
    });
    expect(row).not.toBeNull();
    expect(row?.userId).toBe(user.id);
    expect(row?.consumedAt).toBeNull();
  });

  test("invalidates prior un-consumed tokens for the same user", async () => {
    const user = await makeUser("prt-multi");

    const first = await createPasswordResetToken({ userId: user.id });
    const second = await createPasswordResetToken({ userId: user.id });

    const firstRow = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(first.token) },
    });
    const secondRow = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(second.token) },
    });

    expect(firstRow?.consumedAt).not.toBeNull();
    expect(secondRow?.consumedAt).toBeNull();

    const liveCount = await prisma.passwordResetToken.count({
      where: { userId: user.id, consumedAt: null },
    });
    expect(liveCount).toBe(1);
  });

  test("hashResetToken is deterministic", () => {
    const a = hashResetToken("hello");
    const b = hashResetToken("hello");
    const c = hashResetToken("world");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
