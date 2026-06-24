import nodemailer, { type Transporter } from "nodemailer";

import type { EmailAddress, EmailMessage, EmailTransport } from "./types";

function formatAddress(addr: EmailAddress) {
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
}

/**
 * Local-dev SMTP transport pointed at MailHog. MailHog accepts plaintext SMTP on
 * `SMTP_HOST:SMTP_PORT` with no auth and no TLS. Captured messages can be inspected
 * at `http://localhost:${MAILHOG_UI_PORT}`.
 */
export class MailhogTransport implements EmailTransport {
  private readonly transporter: Transporter;
  private readonly defaultFrom: EmailAddress;
  private readonly uiPort: string | undefined;

  constructor() {
    const host = process.env.SMTP_HOST;
    const portStr = process.env.SMTP_PORT;
    if (!host || !portStr) {
      throw new Error(
        "MailhogTransport requires SMTP_HOST and SMTP_PORT in env",
      );
    }
    const port = Number(portStr);
    if (!Number.isFinite(port)) {
      throw new Error(`MailhogTransport: invalid SMTP_PORT "${portStr}"`);
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      ignoreTLS: true,
    });
    this.defaultFrom = parseFromEnv() ?? {
      email: "no-reply@stormcall.local",
      name: "Storm Call (dev)",
    };
    this.uiPort = process.env.MAILHOG_UI_PORT;
  }

  async send(message: EmailMessage): Promise<{ messageId: string }> {
    const from = message.from ?? this.defaultFrom;
    const info = await this.transporter.sendMail({
      from: formatAddress(from),
      to: formatAddress(message.to),
      subject: message.subject,
      text: message.text,
      html: message.html,
      headers: message.headers,
    });

    if (this.uiPort) {
      console.log(
        `[mailhog] sent "${message.subject}" → ${message.to.email} — view at http://localhost:${this.uiPort}`,
      );
    }

    return { messageId: info.messageId };
  }
}

function parseFromEnv(): EmailAddress | null {
  const raw = process.env.EMAIL_FROM?.trim();
  if (!raw) return null;
  const match = raw.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (match) {
    const name = match[1]?.replace(/^"|"$/g, "").trim();
    const email = match[2];
    if (!email) return { email: raw };
    return { email, name: name || undefined };
  }
  return { email: raw };
}
