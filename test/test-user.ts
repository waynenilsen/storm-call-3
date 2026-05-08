import { createId } from "@paralleldrive/cuid2";

import { signUp } from "@/lib/auth/sign-up";

export async function makeUser(label: string) {
  const slug = createId();
  const result = await signUp({
    name: `${label} ${slug}`,
    email: `${label}-${slug}@example.test`,
    password: "password12abcd",
  });
  if (!result.created) throw new Error("expected signup");
  return result.user;
}
