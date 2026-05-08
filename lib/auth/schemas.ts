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

export const signUpInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: emailSchema,
  password: signUpPasswordSchema,
});

export type SignUpInput = z.infer<typeof signUpInputSchema>;

export const signInInputSchema = z.object({
  email: emailSchema,
  password: signInPasswordSchema,
});

export type SignInInput = z.infer<typeof signInInputSchema>;

export const signOutInputSchema = z.object({
  token: z.string().min(1).max(200),
});

export type SignOutInput = z.infer<typeof signOutInputSchema>;

export const requestPasswordResetInputSchema = z.object({
  email: emailSchema,
});

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetInputSchema
>;

export const completePasswordResetInputSchema = z.object({
  token: z.string().min(1).max(200),
  password: signUpPasswordSchema,
});

export type CompletePasswordResetInput = z.infer<
  typeof completePasswordResetInputSchema
>;
