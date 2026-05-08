/** Shared projection for employee reads / writes returned to callers. */
export const employeeRowSelect = {
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
