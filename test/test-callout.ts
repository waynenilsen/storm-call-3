import { createId } from "@paralleldrive/cuid2";

import { createCallout } from "@/lib/callouts/create";

import { makeOrganizationWithOwner } from "./test-org";

/** Owner, their org, and a callout under that org — parallel-safe (no teardown). */
export async function makeCalloutWithOrg(
  labelPrefix: string,
  options?: { name?: string; messageText?: string },
) {
  const { owner, org } = await makeOrganizationWithOwner(labelPrefix);
  const slug = createId();
  const callout = await createCallout({
    organizationId: org.id,
    actingUserId: owner.id,
    name: options?.name ?? `Callout ${labelPrefix} ${slug}`.slice(0, 200),
    messageText:
      options?.messageText ??
      `Hello from ${labelPrefix} ${slug}`.slice(0, 1600),
  });
  return { owner, org, callout };
}
