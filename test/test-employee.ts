import { createId } from "@paralleldrive/cuid2";

import { createEmployee } from "@/lib/employees/create";

import { makeOrganizationWithOwner } from "./test-org";

/** Owner, their org, and an employee row under that org — parallel-safe (no teardown). */
export async function makeEmployeeWithOrg(
  labelPrefix: string,
  options?: {
    name?: string;
    email?: string;
    phone?: string;
  },
) {
  const { owner, org } = await makeOrganizationWithOwner(labelPrefix);
  const slug = createId();
  const employee = await createEmployee({
    organizationId: org.id,
    actingUserId: owner.id,
    name: options?.name ?? `Employee ${labelPrefix} ${slug}`.slice(0, 200),
    email: options?.email ?? `${labelPrefix}-${slug}@employee.example.test`,
    phone: options?.phone ?? "+12025550123",
  });
  return { owner, org, employee };
}
