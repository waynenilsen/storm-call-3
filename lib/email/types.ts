export type EmailAddress = { email: string; name?: string };

export interface EmailMessage {
  to: EmailAddress;
  from?: EmailAddress;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export interface EmailTransport {
  send(message: EmailMessage): Promise<{ messageId: string }>;
}
