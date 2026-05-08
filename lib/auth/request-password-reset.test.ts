import { afterAll, describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeUser } from "@/test/test-user";

import { prisma } from "../prisma";
import { requestPasswordReset } from "./request-password-reset";

describe("requestPasswordReset", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("unknown email: returns ok with null payload, writes nothing", async () => {
    const fakeEmail = `nobody-${createId()}@example.test`;
    const before = await prisma.passwordResetToken.count();

    const result = await requestPasswordReset({ email: fakeEmail });

    expect(result.ok).toBe(true);
    expect(result.emailPayload).toBeNull();

    const after = await prisma.passwordResetToken.count();
    expect(after).toBe(before);
  });

  test("known email: returns payload and persists exactly one live token", async () => {
    const user = await makeUser("rpr-known");

    const result = await requestPasswordReset({ email: user.email });

    expect(result.ok).toBe(true);
    expect(result.emailPayload?.email).toBe(user.email);
    expect(result.emailPayload?.name).toBe(user.name);
    expect(typeof result.emailPayload?.token).toBe("string");

    const live = await prisma.passwordResetToken.count({
      where: { userId: user.id, consumedAt: null },
    });
    expect(live).toBe(1);
  });

  test("calling twice consumes the first token and keeps one live", async () => {
    const user = await makeUser("rpr-twice");

    await requestPasswordReset({ email: user.email });
    await requestPasswordReset({ email: user.email });

    const live = await prisma.passwordResetToken.count({
      where: { userId: user.id, consumedAt: null },
    });
    expect(live).toBe(1);

    const all = await prisma.passwordResetToken.count({
      where: { userId: user.id },
    });
    expect(all).toBe(2);
  });
});
