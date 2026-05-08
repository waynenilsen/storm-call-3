/** Shared projection for message reads / writes returned to callers. */
export const messageRowSelect = {
  id: true,
  organizationId: true,
  conversationId: true,
  content: true,
  direction: true,
  sentByUserId: true,
  sentByUserName: true,
  providerMessageId: true,
  status: true,
  errorCode: true,
  createdAt: true,
  updatedAt: true,
} as const;
