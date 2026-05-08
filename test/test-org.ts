import { createId } from "@paralleldrive/cuid2";

import { createOrganization } from "@/lib/organizations/create";

import { makeUser } from "./test-user";

/** Owner user and the org they created; for parallel-safe DB tests (no teardown). */
export async function makeOrganizationWithOwner(labelPrefix: string) {
  const owner = await makeUser(labelPrefix);
  const org = await createOrganization({
    name: `Org ${labelPrefix} ${createId()}`,
    ownerUserId: owner.id,
  });
  return { owner, org };
}
