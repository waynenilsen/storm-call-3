import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";

function SignInFormFallback() {
  return (
    <div
      className="h-64 w-full max-w-md animate-pulse rounded-xl bg-muted"
      aria-hidden
    />
  );
}

export default function SignInPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <Suspense fallback={<SignInFormFallback />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
