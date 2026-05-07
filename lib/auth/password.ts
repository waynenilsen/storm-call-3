import bcrypt from "bcrypt";

import { BCRYPT_COST } from "./schemas";

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/** Pre-hashed pad for sign-in timing when user is unknown (same cost as real hashes). */
export const timingPadDummyHash = hashPassword("__sign_in_timing_pad__");
