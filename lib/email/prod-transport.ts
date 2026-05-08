// TODO(prod): replace this stub with a real transport (Resend / Postmark / SES /
// nodemailer-against-real-SMTP). Choose based on deliverability requirements and
// wire credentials via env. The factory in `./index.ts` returns this class when
// NODE_ENV === "production"; failing loudly here forces a deliberate decision
// before email features ship to prod.

import type { EmailMessage, EmailTransport } from "./types";

export class ProdEmailTransport implements EmailTransport {
  async send(_message: EmailMessage): Promise<{ messageId: string }> {
    throw new Error(
      "ProdEmailTransport is not implemented yet. Wire up a real provider " +
        "(Resend/SES/Postmark) and update lib/email/index.ts.",
    );
  }
}
