import { describe, expect, test } from "bun:test";

import {
  InvalidEmployeePhoneError,
  normalizeIncomingUsPhoneToE164,
} from "./phone-us";

describe("normalizeIncomingUsPhoneToE164", () => {
  test("formats US national-ish input as E.164", () => {
    expect(normalizeIncomingUsPhoneToE164("(206) 555-0199")).toBe(
      "+12065550199",
    );
    expect(normalizeIncomingUsPhoneToE164("2065550199")).toBe("+12065550199");
    expect(normalizeIncomingUsPhoneToE164("+1 2065550199")).toBe(
      "+12065550199",
    );
  });

  test("leaves canonical US E.164 unchanged apart from normalization", () => {
    expect(normalizeIncomingUsPhoneToE164("+12025550123")).toBe("+12025550123");
  });

  test("rejects whitespace-only input", () => {
    expect(() => normalizeIncomingUsPhoneToE164("   \t")).toThrow(
      InvalidEmployeePhoneError,
    );
  });

  test("rejects non-US country calling codes", () => {
    expect(() => normalizeIncomingUsPhoneToE164("+44 7911 123456")).toThrow(
      InvalidEmployeePhoneError,
    );
  });

  test("rejects Mexican and other non-US country codes", () => {
    expect(() => normalizeIncomingUsPhoneToE164("+52 55 5123 4567")).toThrow(
      InvalidEmployeePhoneError,
    );
  });

  test("rejects invalid digit patterns", () => {
    expect(() => normalizeIncomingUsPhoneToE164("not-a-phone")).toThrow(
      InvalidEmployeePhoneError,
    );
  });
});
