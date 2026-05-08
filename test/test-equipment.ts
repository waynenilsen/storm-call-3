import { createId } from "@paralleldrive/cuid2";

import { createEquipment } from "@/lib/equipment/create";
import type {
  CreateEquipmentInput,
  MechanicalStatus,
  ToolStatus,
} from "@/lib/equipment/schemas";

import { makeOrganizationWithOwner } from "./test-org";

/** Owner, their org, and a piece of equipment under that org — parallel-safe (no teardown). */
export async function makeEquipmentWithOrg(
  labelPrefix: string,
  options?: Partial<
    Omit<CreateEquipmentInput, "organizationId"> & {
      mechanicalStatus: MechanicalStatus;
      toolStatus: ToolStatus;
    }
  >,
) {
  const { owner, org } = await makeOrganizationWithOwner(labelPrefix);
  const slug = createId();
  const equipment = await createEquipment({
    organizationId: org.id,
    actingUserId: owner.id,
    companyCode:
      options?.companyCode ?? `EQ-${labelPrefix}-${slug}`.slice(0, 120),
    type: options?.type ?? "vehicle",
    subtype: options?.subtype ?? "truck",
    mechanicalStatus: options?.mechanicalStatus,
    toolStatus: options?.toolStatus,
    notes: options?.notes,
  });
  return { owner, org, equipment };
}
