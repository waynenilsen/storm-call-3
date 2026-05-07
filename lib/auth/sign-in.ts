import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { BCRYPT_COST, emailSchema, signInPasswordSchema } from "./schemas";

export const signInInputSchema = z.object({
  email: emailSchema,
  password: signInPasswordSchema,
});

export type SignInInput = z.infer<typeof signInInputSchema>;

const DUMMY_PASSWORD_HASH: Promise<string> = Bun.password.hash(
  "__sign_in_timing_pad__",
  { algorithm: "bcrypt", cost: BCRYPT_COST },
);

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
      createdAt: true,
      passwordHash: true,
    },
  });

  const hashForVerify = user?.passwordHash ?? (await DUMMY_PASSWORD_HASH);
  const passwordMatches = await Bun.password.verify(
    params.password,
    hashForVerify,
  );

  if (!user || !passwordMatches) {
    return { ok: false as const };
  }

  return {
    ok: true as const,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
  };
}
