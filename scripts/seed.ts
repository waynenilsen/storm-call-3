/**
 * Dev seeder. Assumes migrations are already applied. Re-runnable: existing
 * user/org/contacts/messages are reused rather than duplicated.
 *
 * Run with: bunx dotenv -- bun scripts/seed.ts
 */
import { prisma } from "@/lib/prisma";
import { seedContacts } from "@/seed/contacts";
import { seedMessages } from "@/seed/messages";
import { findOrCreateSeedOrg } from "@/seed/orgs";
import { findOrCreateSeedUser, SEED_USER } from "@/seed/users";

async function main() {
  const user = await findOrCreateSeedUser();
  console.log(
    user.created
      ? `created seed user ${user.email} (${user.id})`
      : `reusing seed user ${user.email} (${user.id})`,
  );

  const org = await findOrCreateSeedOrg(user.id);
  console.log(
    org.created
      ? `created seed org "${org.name}" (slug=${org.slug})`
      : `reusing seed org "${org.name}" (slug=${org.slug})`,
  );

  const contacts = await seedContacts(org.id, user.id);
  console.log(`seeded ${contacts.length} contacts`);

  await seedMessages(org.id, user.id, contacts);
  console.log("seeded messages");

  console.log("\n--- LOGIN ---");
  console.log(`email:    ${SEED_USER.email}`);
  console.log(`password: ${SEED_USER.password}`);
  console.log(`org URL:  /o/${org.slug}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
