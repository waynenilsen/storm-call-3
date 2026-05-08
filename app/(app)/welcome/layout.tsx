import { redirect } from "next/navigation";

import { requireSessionUserSsr } from "@/lib/auth/ssr-session";
import { resolveAuthenticatedLandingPath } from "@/lib/routing/authenticated-landing";

export default async function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSessionUserSsr("/welcome");
  const landing = await resolveAuthenticatedLandingPath(user.id);
  if (landing !== "/welcome") {
    redirect(landing);
  }
  return children;
}
