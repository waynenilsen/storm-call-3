"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
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

export function ForgotPasswordForm() {
  const trpc = useTRPC();
  const formId = useId();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestMutation = useMutation(
    trpc.auth.requestPasswordReset.mutationOptions({
      onSuccess: () => {
        setErrorMessage(null);
        setSubmitted(true);
      },
      onError: (err) => {
        setErrorMessage(err.message);
      },
    }),
  );

  if (submitted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            If an account exists for <strong>{email}</strong>, we've sent a
            password reset link. The link expires in 1 hour.
          </CardDescription>
        </CardHeader>
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Forgot password</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMessage(null);
            requestMutation.mutate({ email });
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-email`}>Email</Label>
            <Input
              id={`${formId}-email`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={requestMutation.isPending}
            />
          </div>
          <Button type="submit" disabled={requestMutation.isPending}>
            {requestMutation.isPending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
        {errorMessage ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-1 text-xs text-muted-foreground">
        <span>Remembered it?</span>
        <Link
          href="/sign-in"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
