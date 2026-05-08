/** Shared projection for conversation reads / writes returned to callers. */
export const conversationRowSelect = {
  id: true,
  organizationId: true,
  contactId: true,
  lastMessageAt: true,
  lastMessagePreview: true,
  lastMessageDirection: true,
  lastInboundAt: true,
  lastOutboundAt: true,
  messageCount: true,
  unreadCount: true,
  createdAt: true,
  updatedAt: true,
} as const;
