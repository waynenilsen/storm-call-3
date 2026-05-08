import { expect } from "bun:test";
import { TRPCError } from "@trpc/server";

/** Assert `err` is a {@link TRPCError} with the given `code` and optional `message`. */
export function expectTrpcError(
  err: unknown,
  code: TRPCError["code"],
  message?: string,
) {
  expect(err).toBeInstanceOf(TRPCError);
  const t = err as TRPCError;
  expect(t.code).toBe(code);
  if (message !== undefined) {
    expect(t.message).toBe(message);
  }
}

/** Run `fn` and assert it rejects with the expected {@link TRPCError}. */
export async function expectTrpcErrorFrom(
  fn: () => Promise<unknown>,
  code: TRPCError["code"],
  message?: string,
) {
  let err: unknown;
  try {
    await fn();
    err = undefined;
  } catch (e) {
    err = e;
  }
  expect(err).toBeDefined();
  expectTrpcError(err, code, message);
}
