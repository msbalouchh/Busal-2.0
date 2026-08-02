"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { AuthDivider } from "@/modules/auth/components/auth-divider";
import { AuthFormField } from "@/modules/auth/components/auth-form-field";
import { AuthSubmitButton } from "@/modules/auth/components/auth-submit-button";
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
      rememberMe: false,
    },
  });

  useEffect(() => {
    if (errorMessage) {
      form.setError("root", { message: errorMessage });
    }
  }, [errorMessage, form]);

  return (
    <div className="auth-form">
      {form.formState.errors.root ? (
        <p className="auth-alert auth-alert--error" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}

      <FormWrapper form={form} onSubmit={(values) => login.mutate({ ...values, redirectTo })}>
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

        <div className="auth-row">
          <label className="auth-remember" htmlFor="rememberMe">
            <Checkbox
              id="rememberMe"
              disabled={login.isPending}
              checked={form.watch("rememberMe")}
              onChange={(event) => form.setValue("rememberMe", event.target.checked)}
            />
            Remember me
          </label>
          <Link
            href={ROUTES.forgotPassword}
            className="auth-link"
            tabIndex={login.isPending ? -1 : 0}
          >
            Forgot password?
          </Link>
        </div>

        <AuthSubmitButton isLoading={login.isPending} loadingLabel="Signing in…">
          Continue
        </AuthSubmitButton>
      </FormWrapper>

      <AuthDivider label="Or continue with" />

      <GoogleSignInButton />

      <p className="auth-footer-text">
        Don&apos;t have an account? <Link href={ROUTES.signup}>Create Workspace</Link>
      </p>
    </div>
  );
}
