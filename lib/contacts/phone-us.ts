import { parsePhoneNumberWithError } from "libphonenumber-js";

const DEFAULT_REGION = "US" as const;

export class InvalidContactPhoneError extends Error {
  constructor() {
    super("invalid US phone number");
    this.name = "InvalidContactPhoneError";
  }
}

/**
 * Parses input as a **US** phone number (default region US) and returns **E.164**
 * (e.g. `+12065550100`). Canadian and other `+1` NANP countries are rejected.
 */
export function normalizeIncomingUsPhoneToE164(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new InvalidContactPhoneError();
  }
  try {
    const parsed = parsePhoneNumberWithError(trimmed, DEFAULT_REGION);
    if (parsed.country !== DEFAULT_REGION || !parsed.isValid()) {
      throw new InvalidContactPhoneError();
    }
    return parsed.format("E.164");
  } catch (e) {
    if (e instanceof InvalidContactPhoneError) throw e;
    throw new InvalidContactPhoneError();
  }
}
