import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";
import { completePasswordReset } from "./complete-password-reset";
import { verifyPassword } from "./password";
import {
  createPasswordResetToken,
  hashResetToken,
} from "./password-reset-token";
import { createSession, hashSessionToken } from "./session";

describe("completePasswordReset", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("happy path: updates password, consumes token, revokes sessions", async () => {
    const user = await makeUser("cpr-ok");
    const session = await createSession({ userId: user.id });
    const { token } = await createPasswordResetToken({ userId: user.id });

    const result = await completePasswordReset({
      token,
      password: "newpassword789xyz",
    });
    expect(result.ok).toBe(true);

    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    expect(
      await verifyPassword("newpassword789xyz", updated.passwordHash),
    ).toBe(true);

    const tokenRow = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
    });
    expect(tokenRow?.consumedAt).not.toBeNull();

    const sessionRow = await prisma.session.findUniqueOrThrow({
      where: { tokenHash: hashSessionToken(session.token) },
    });
    expect(sessionRow.revokedAt).not.toBeNull();
  });

  test("invalid token", async () => {
    const result = await completePasswordReset({
      token: `nope-${createId()}`,
      password: "anothergoodpw1",
    });
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  test("expired token", async () => {
    const user = await makeUser("cpr-expired");
    const { token } = await createPasswordResetToken({ userId: user.id });

    await prisma.passwordResetToken.update({
      where: { tokenHash: hashResetToken(token) },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const result = await completePasswordReset({
      token,
      password: "anothergoodpw1",
    });
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  test("already-consumed token cannot be reused", async () => {
    const user = await makeUser("cpr-reuse");
    const { token } = await createPasswordResetToken({ userId: user.id });

    const first = await completePasswordReset({
      token,
      password: "firstpassword12",
    });
    expect(first.ok).toBe(true);

    const second = await completePasswordReset({
      token,
      password: "secondpassword34",
    });
    expect(second).toEqual({ ok: false, reason: "consumed" });
  });
});
