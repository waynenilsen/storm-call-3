import { createId } from "@paralleldrive/cuid2";

import { createContact } from "@/lib/contacts/create";

import { makeOrganizationWithOwner } from "./test-org";

/** Owner, their org, and a contact row under that org — parallel-safe (no teardown). */
export async function makeContactWithOrg(
  labelPrefix: string,
  options?: {
    name?: string;
    email?: string;
    phone?: string;
  },
) {
  const { owner, org } = await makeOrganizationWithOwner(labelPrefix);
  const slug = createId();
  const contact = await createContact({
    organizationId: org.id,
    actingUserId: owner.id,
    name: options?.name ?? `Contact ${labelPrefix} ${slug}`.slice(0, 200),
    email: options?.email ?? `${labelPrefix}-${slug}@contact.example.test`,
    phone: options?.phone ?? "+12025550123",
  });
  return { owner, org, contact };
}
