"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { AuthFormField } from "@/modules/auth/components/auth-form-field";
import { GoogleSignInButton } from "@/modules/auth/components/google-sign-in-button";
import { PasswordInput } from "@/modules/auth/components/password-input";
import { useLogin } from "@/modules/auth/hooks/use-auth";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const errorMessage = searchParams.get("error") ?? searchParams.get("auth_error");
  const login = useLogin(redirectTo);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (errorMessage) {
      form.setError("root", { message: errorMessage });
    }
  }, [errorMessage, form]);

  return (
    <div className="space-y-6">
      <GoogleSignInButton />

      <FormWrapper form={form} onSubmit={(values) => login.mutate({ ...values, redirectTo })}>
        {form.formState.errors.root ? (
          <p
            className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
            role="alert"
          >
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <AuthFormField id="email" label="Email" error={form.formState.errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            disabled={login.isPending}
            {...form.register("email")}
          />
        </AuthFormField>

        <AuthFormField id="password" label="Password" error={form.formState.errors.password}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            disabled={login.isPending}
            {...form.register("password")}
          />
        </AuthFormField>

        <div className="flex justify-end">
          <Link
            href={ROUTES.forgotPassword}
            className="text-primary text-sm hover:underline"
            tabIndex={login.isPending ? -1 : 0}
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </FormWrapper>

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.signup} className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
