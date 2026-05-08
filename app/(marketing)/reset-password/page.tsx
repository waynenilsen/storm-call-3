import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

function ResetPasswordFallback() {
  return (
    <div
      className="h-64 w-full max-w-md animate-pulse rounded-xl bg-muted"
      aria-hidden
    />
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
