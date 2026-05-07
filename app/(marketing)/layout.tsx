import type { ReactNode } from "react";

import { SiteHeader } from "@/components/marketing/site-header";

export const dynamic = "force-static";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader />
      {children}
    </div>
  );
}
