import { createId } from "@paralleldrive/cuid2";

import { createContact } from "@/lib/contacts/create";
import { createEmployee } from "@/lib/employees/create";

import { makeOrganizationWithOwner } from "./test-org";

/** Owner, their org, a contact, and an employee record under that org — parallel-safe (no teardown). */
export async function makeEmployeeWithOrg(
  labelPrefix: string,
  options?: { notes?: string },
) {
  const { owner, org } = await makeOrganizationWithOwner(labelPrefix);
  const slug = createId();
  const contact = await createContact({
    organizationId: org.id,
    actingUserId: owner.id,
    name: `Contact ${labelPrefix} ${slug}`.slice(0, 200),
    email: `${labelPrefix}-${slug}@employee.example.test`,
  });
  const employee = await createEmployee({
    organizationId: org.id,
    actingUserId: owner.id,
    contactId: contact.id,
    notes: options?.notes,
  });
  return { owner, org, contact, employee };
}
