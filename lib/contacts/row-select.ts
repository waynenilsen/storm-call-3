/** Shared projection for contact reads / writes returned to callers. */
export const contactRowSelect = {
  id: true,
  organizationId: true,
  name: true,
  email: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
  createdByUserId: true,
  updatedByUserId: true,
  createdByUserName: true,
  updatedByUserName: true,
} as const;
