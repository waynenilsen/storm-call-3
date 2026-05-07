"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { normalizeClientNextParam } from "@/lib/auth/nav";
import { useTRPC } from "@/lib/trpc/client";

export function SignInForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const signInMutation = useMutation(
    trpc.auth.signIn.mutationOptions({
      onSuccess: async (data) => {
        if (!data.ok) {
          setMessage("Invalid email or password.");
          return;
        }
        setMessage(null);
        await queryClient.invalidateQueries(trpc.auth.session.queryFilter());
        router.replace(normalizeClientNextParam(searchParams.get("next")));
      },
      onError: (err) => {
        setMessage(err.message);
      },
    }),
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Use your email and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setMessage(null);
            signInMutation.mutate({ email, password });
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
              disabled={signInMutation.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-password`}>Password</Label>
            <Input
              id={`${formId}-password`}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={signInMutation.isPending}
            />
          </div>
          <Button type="submit" disabled={signInMutation.isPending}>
            {signInMutation.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        {message ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {message}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-1 text-xs text-muted-foreground">
        <span>No account?</span>
        <Link
          href="/sign-up"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
}
