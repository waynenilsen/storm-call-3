import { Suspense } from "react";

import { SignUpForm } from "@/components/auth/sign-up-form";

function SignUpFormFallback() {
  return (
    <div
      className="h-64 w-full max-w-md animate-pulse rounded-xl bg-muted"
      aria-hidden
    />
  );
}

export default function SignUpPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <Suspense fallback={<SignUpFormFallback />}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}
