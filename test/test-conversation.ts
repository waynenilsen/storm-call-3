import { getConversationByContactId } from "@/lib/conversations/get";

import { makeContactWithOrg } from "./test-contact";

/**
 * Owner, their org, a contact, and the conversation auto-created alongside the
 * contact — parallel-safe (no teardown).
 */
export async function makeConversationWithContact(
  labelPrefix: string,
  options?: { name?: string; email?: string; phone?: string },
) {
  const { owner, org, contact } = await makeContactWithOrg(
    labelPrefix,
    options,
  );
  const conversation = await getConversationByContactId({
    contactId: contact.id,
    organizationId: org.id,
  });
  if (!conversation) {
    throw new Error(
      `expected conversation to be auto-created for contact ${contact.id}`,
    );
  }
  return { owner, org, contact, conversation };
}
