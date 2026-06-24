import { describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { MailhogTransport } from "./mailhog-transport";

const uiPort = process.env.MAILHOG_UI_PORT;

describe.skipIf(!uiPort)("MailhogTransport", () => {
  test("delivers a message that MailHog captures", async () => {
    const transport = new MailhogTransport();
    const subjectTag = `mailhog-test-${createId()}`;

    const { messageId } = await transport.send({
      to: { email: `${createId()}@example.test`, name: "Recipient" },
      subject: subjectTag,
      text: "hello from the test",
      html: "<p>hello from the test</p>",
    });
    expect(messageId).toBeTruthy();

    const res = await fetch(
      `http://localhost:${uiPort}/api/v2/search?kind=containing&query=${subjectTag}`,
    );
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { total: number };
    expect(data.total).toBeGreaterThan(0);
  });
});
