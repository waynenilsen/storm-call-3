import { MailhogTransport } from "./mailhog-transport";
import { ProdEmailTransport } from "./prod-transport";
import type { EmailMessage, EmailTransport } from "./types";

let cached: EmailTransport | null = null;

export function getEmailTransport(): EmailTransport {
  if (cached) return cached;
  cached =
    process.env.NODE_ENV === "production"
      ? new ProdEmailTransport()
      : new MailhogTransport();
  return cached;
}

export function sendEmail(message: EmailMessage) {
  return getEmailTransport().send(message);
}

export type { EmailAddress, EmailMessage, EmailTransport } from "./types";
