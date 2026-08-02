"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { AuthFormField } from "@/modules/auth/components/auth-form-field";
import { AuthSubmitButton } from "@/modules/auth/components/auth-submit-button";
import { useForgotPassword } from "@/modules/auth/hooks/use-auth";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/schemas/auth.schema";

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  if (forgotPassword.isSuccess) {
    return (
      <div className="auth-form">
        <div className="auth-alert auth-alert--success" role="status">
          If an account exists for <strong className="text-white">{form.getValues("email")}</strong>
          , you will receive a password reset link shortly.
        </div>
        <Link
          href={ROUTES.login}
          className="auth-submit inline-flex items-center justify-center no-underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <FormWrapper form={form} onSubmit={(values) => forgotPassword.mutate(values)}>
        <AuthFormField id="email" label="Email" error={form.formState.errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            disabled={forgotPassword.isPending}
            {...form.register("email")}
          />
        </AuthFormField>

        <AuthSubmitButton isLoading={forgotPassword.isPending} loadingLabel="Sending link…">
          Send reset link
        </AuthSubmitButton>
      </FormWrapper>

      <p className="auth-footer-text">
        Remember your password? <Link href={ROUTES.login}>Sign in</Link>
      </p>
    </div>
  );
}
