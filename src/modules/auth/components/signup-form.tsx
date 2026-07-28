"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { AuthFormField } from "@/modules/auth/components/auth-form-field";
import { GoogleSignInButton } from "@/modules/auth/components/google-sign-in-button";
import { PasswordInput } from "@/modules/auth/components/password-input";
import { useSignup } from "@/modules/auth/hooks/use-auth";
import { signupSchema, type SignupFormValues } from "@/schemas/auth.schema";

export function SignupForm() {
  const signup = useSignup();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <div className="space-y-6">
      <GoogleSignInButton label="Sign up with Google" />

      <FormWrapper form={form} onSubmit={(values) => signup.mutate(values)}>
        <AuthFormField id="fullName" label="Full name" error={form.formState.errors.fullName}>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="John Smith"
            disabled={signup.isPending}
            {...form.register("fullName")}
          />
        </AuthFormField>

        <AuthFormField id="email" label="Email" error={form.formState.errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            disabled={signup.isPending}
            {...form.register("email")}
          />
        </AuthFormField>

        <AuthFormField id="password" label="Password" error={form.formState.errors.password}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            disabled={signup.isPending}
            {...form.register("password")}
          />
        </AuthFormField>

        <AuthFormField
          id="confirmPassword"
          label="Confirm password"
          error={form.formState.errors.confirmPassword}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Confirm your password"
            disabled={signup.isPending}
            {...form.register("confirmPassword")}
          />
        </AuthFormField>

        <p className="text-muted-foreground text-xs">
          Password must be at least 8 characters with uppercase, lowercase, number, and special
          character.
        </p>

        <Button type="submit" className="w-full" disabled={signup.isPending}>
          {signup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create account
        </Button>
      </FormWrapper>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
