import { createId } from "@paralleldrive/cuid2";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";

import type { PrismaTransaction } from "../prisma";
import { prisma } from "../prisma";
import { BCRYPT_COST, emailSchema, signUpPasswordSchema } from "./schemas";

export const signUpInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: emailSchema,
  password: signUpPasswordSchema,
});

export type SignUpInput = z.infer<typeof signUpInputSchema>;

type SignedUpUserRow = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
};

export async function signUp(
  params: SignUpInput,
  tx: PrismaTransaction | PrismaClient = prisma,
) {
  const passwordHash = await Bun.password.hash(params.password, {
    algorithm: "bcrypt",
    cost: BCRYPT_COST,
  });
  const id = createId();

  const rows = await tx.$queryRaw<SignedUpUserRow[]>`
    INSERT INTO "User" ("id", "name", "email", "passwordHash", "updatedAt")
    VALUES (${id}, ${params.name}, ${params.email}, ${passwordHash}, NOW())
    ON CONFLICT ("email") DO NOTHING
    RETURNING "id", "name", "email", "createdAt"
  `;

  const row = rows[0];
  if (!row) return { created: false as const };
  return { created: true as const, user: row };
}
