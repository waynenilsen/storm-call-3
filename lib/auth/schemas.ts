import { z } from "zod";

export const BCRYPT_MAX_BYTES = 72;
export const BCRYPT_COST = 12;

export const emailSchema = z.email().trim().toLowerCase();

export const signUpPasswordSchema = z
  .string()
  .min(8)
  .refine((p) => Buffer.byteLength(p, "utf8") <= BCRYPT_MAX_BYTES, {
    message: `Password must be at most ${BCRYPT_MAX_BYTES} bytes`,
  });

/**
 * Sign-in accepts any string so historical accounts whose passwords predate later sign-up
 * policy tightening can still authenticate. Credential checks happen via bcrypt verify, not
 * via input validation.
 */
export const signInPasswordSchema = z.string();
