import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingHome() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Placeholder marketing site
        </h1>
        <p className="mt-3 text-pretty text-sm text-muted-foreground md:text-base">
          Hero and product story will go here. For now this page stays minimal
          while auth and the app shell live on their own routes.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/sign-up"
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
          )}
        >
          Get started
        </Link>
        <Link
          href="/sign-in"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
          )}
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
