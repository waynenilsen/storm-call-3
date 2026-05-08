"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/lib/trpc/client";

const FAILURE_MESSAGES: Record<"invalid" | "expired" | "consumed", string> = {
  invalid:
    "This reset link is invalid. Request a new one from the forgot password page.",
  expired:
    "This reset link has expired. Request a new one from the forgot password page.",
  consumed:
    "This reset link has already been used. Request a new one if you still need to reset your password.",
};

export function ResetPasswordForm() {
  const trpc = useTRPC();
  const searchParams = useSearchParams();
  const formId = useId();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const completeMutation = useMutation(
    trpc.auth.completePasswordReset.mutationOptions({
      onSuccess: (data) => {
        if (data.ok) {
          setSuccess(true);
          setServerError(null);
          return;
        }
        setServerError(FAILURE_MESSAGES[data.reason]);
      },
      onError: (err) => {
        setServerError(err.message);
      },
    }),
  );

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Invalid reset link</CardTitle>
          <CardDescription>
            This page needs a valid reset token. If you arrived here by clicking
            a link in an email, the link may be malformed.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-1 text-xs text-muted-foreground">
          <Link
            href="/forgot-password"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Request a new link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Password updated</CardTitle>
          <CardDescription>
            Your password has been reset. Sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-1 text-xs text-muted-foreground">
          <Link
            href="/sign-in"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Go to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Choose a new password</CardTitle>
        <CardDescription>
          Pick a password you don't use anywhere else.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setClientError(null);
            setServerError(null);
            if (password !== confirmPassword) {
              setClientError("Passwords don't match.");
              return;
            }
            completeMutation.mutate({ token, password });
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-password`}>New password</Label>
            <Input
              id={`${formId}-password`}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={completeMutation.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-confirm`}>Confirm password</Label>
            <Input
              id={`${formId}-confirm`}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              disabled={completeMutation.isPending}
            />
          </div>
          <Button type="submit" disabled={completeMutation.isPending}>
            {completeMutation.isPending ? "Updating…" : "Update password"}
          </Button>
        </form>
        {clientError ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {clientError}
          </p>
        ) : null}
        {serverError ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {serverError}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-1 text-xs text-muted-foreground">
        <Link
          href="/sign-in"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
