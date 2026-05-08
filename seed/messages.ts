import { getConversationByContactId } from "@/lib/conversations/get";
import { createMessage } from "@/lib/messages/create";
import {
  MESSAGE_DIRECTION,
  type MessageDirection,
} from "@/lib/messages/schemas";

import type { SeededContact } from "./contacts";

type ScriptedMessage = {
  direction: MessageDirection;
  content: string;
};

const SCRIPTS: Record<string, readonly ScriptedMessage[]> = {
  // Outbound only — operator pinged the contact, no response yet.
  alice: [
    {
      direction: MESSAGE_DIRECTION.OUTBOUND,
      content:
        "Hey Alice, just confirming you're on for the 9am shift tomorrow.",
    },
  ],
  // Full back-and-forth.
  bob: [
    {
      direction: MESSAGE_DIRECTION.OUTBOUND,
      content: "Hi Bob — site needs an extra hand at 7am Saturday. Available?",
    },
    {
      direction: MESSAGE_DIRECTION.INBOUND,
      content: "Yep, I can swing it. Where am I parking?",
    },
    {
      direction: MESSAGE_DIRECTION.OUTBOUND,
      content: "Lot C, gate code 4827. Bring boots — it'll be muddy.",
    },
    {
      direction: MESSAGE_DIRECTION.INBOUND,
      content: "Got it, thanks!",
    },
  ],
  // Inbound only — contact texted in unprompted; conversation should show as unread.
  carol: [
    {
      direction: MESSAGE_DIRECTION.INBOUND,
      content: "Hey, my truck broke down and I'm gonna be 30 min late. Sorry!",
    },
  ],
  // Long thread.
  dave: [
    {
      direction: MESSAGE_DIRECTION.OUTBOUND,
      content: "Dave, callout for snow duty tonight, 11pm-7am. You in?",
    },
    {
      direction: MESSAGE_DIRECTION.INBOUND,
      content: "Yeah I can take it. Same route as last week?",
    },
    {
      direction: MESSAGE_DIRECTION.OUTBOUND,
      content: "Mostly — they added the high school loop. Map is in the truck.",
    },
    {
      direction: MESSAGE_DIRECTION.INBOUND,
      content: "Cool. Salt levels?",
    },
    {
      direction: MESSAGE_DIRECTION.OUTBOUND,
      content: "Topped off this afternoon. Should be plenty for one shift.",
    },
    {
      direction: MESSAGE_DIRECTION.INBOUND,
      content: "Perfect. See you at the yard.",
    },
  ],
  // Single recent inbound — bumps unread count.
  eve: [
    {
      direction: MESSAGE_DIRECTION.INBOUND,
      content: "Confirming I got the reschedule notice — see you Tuesday.",
    },
  ],
};

/**
 * Replays the scripted message log for each contact. Skips contacts whose
 * conversation already has messages so re-running doesn't duplicate history.
 */
export async function seedMessages(
  organizationId: string,
  actingUserId: string,
  contacts: readonly SeededContact[],
) {
  for (const contact of contacts) {
    const script = SCRIPTS[contact.key];
    if (!script || script.length === 0) continue;

    const conversation = await getConversationByContactId({
      organizationId,
      contactId: contact.id,
    });
    if (!conversation) {
      throw new Error(
        `expected auto-created conversation for contact ${contact.name}`,
      );
    }
    if (conversation.messageCount > 0) continue;

    for (const m of script) {
      await createMessage({
        organizationId,
        conversationId: conversation.id,
        direction: m.direction,
        content: m.content,
        ...(m.direction === MESSAGE_DIRECTION.OUTBOUND ? { actingUserId } : {}),
      });
      // Tiny stagger so createdAt timestamps differ. Without this, messages
      // posted in the same millisecond can sort by id alone, which still works
      // but reads less naturally in the dev UI.
      await new Promise((r) => setTimeout(r, 5));
    }
  }
}
