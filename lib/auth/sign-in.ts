import type { PrismaClient } from "@prisma/client";
import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { timingPadDummyHash, verifyPassword } from "./password";
import type { SignInInput } from "./schemas";

export async function signIn(
  params: SignInInput,
  tx: PrismaTransaction | PrismaClient = prisma,
) {
  const user = await tx.user.findUnique({
    where: { email: params.email },
    select: {
      id: true,
      email: true,
      name: true,
      selectedOrganizationId: true,
      createdAt: true,
      passwordHash: true,
    },
  });

  const hashForVerify = user?.passwordHash ?? (await timingPadDummyHash);
  const passwordMatches = await verifyPassword(params.password, hashForVerify);

  if (!user || !passwordMatches) {
    return { ok: false as const };
  }

  return {
    ok: true as const,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      selectedOrganizationId: user.selectedOrganizationId,
      createdAt: user.createdAt,
    },
  };
}
