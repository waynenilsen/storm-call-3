import { signUp } from "@/lib/auth/sign-up";
import { prisma } from "@/lib/prisma";

export const SEED_USER = {
  email: "dev@example.com",
  password: "devpassword123",
  name: "Dev User",
} as const;

/**
 * Idempotent: if the seed user already exists we just fetch them. signUp uses
 * INSERT ... ON CONFLICT DO NOTHING, so a re-run is harmless.
 */
export async function findOrCreateSeedUser() {
  const result = await signUp(SEED_USER);
  if (result.created) {
    return { id: result.user.id, email: result.user.email, created: true };
  }
  const existing = await prisma.user.findUniqueOrThrow({
    where: { email: SEED_USER.email },
    select: { id: true, email: true },
  });
  return { id: existing.id, email: existing.email, created: false };
}
