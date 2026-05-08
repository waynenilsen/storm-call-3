import type { ReactNode } from "react";

import { SiteHeader } from "@/components/marketing/site-header";
import { redirectToAuthenticatedLandingIfSessionSsr } from "@/lib/auth/ssr-session";

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  await redirectToAuthenticatedLandingIfSessionSsr();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader />
      {children}
    </div>
  );
}
