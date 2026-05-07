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

export function SignUpForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const signUpMutation = useMutation(
    trpc.auth.signUp.mutationOptions({
      onSuccess: async (data) => {
        if (!data.created) {
          setMessage("An account with this email already exists.");
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
        <CardTitle className="text-xl">Sign up</CardTitle>
        <CardDescription>
          Create an account to open the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setMessage(null);
            signUpMutation.mutate({ name, email, password });
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-name`}>Name</Label>
            <Input
              id={`${formId}-name`}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={signUpMutation.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-email`}>Email</Label>
            <Input
              id={`${formId}-email`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={signUpMutation.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${formId}-password`}>Password</Label>
            <Input
              id={`${formId}-password`}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={signUpMutation.isPending}
            />
          </div>
          <Button type="submit" disabled={signUpMutation.isPending}>
            {signUpMutation.isPending ? "Creating account…" : "Sign up"}
          </Button>
        </form>
        {message ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {message}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-1 text-xs text-muted-foreground">
        <span>Already have an account?</span>
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
