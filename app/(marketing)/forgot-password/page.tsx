import { Suspense } from "react";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

function ForgotPasswordFallback() {
  return (
    <div
      className="h-64 w-full max-w-md animate-pulse rounded-xl bg-muted"
      aria-hidden
    />
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <Suspense fallback={<ForgotPasswordFallback />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
