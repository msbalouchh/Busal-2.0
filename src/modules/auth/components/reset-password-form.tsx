"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormWrapper } from "@/components/common/form-wrapper";
import { AuthFormField } from "@/modules/auth/components/auth-form-field";
import { AuthSubmitButton } from "@/modules/auth/components/auth-submit-button";
import { PasswordInput } from "@/modules/auth/components/password-input";
import { PasswordStrengthMeter } from "@/modules/auth/components/password-strength-meter";
import { useResetPassword } from "@/modules/auth/hooks/use-auth";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/schemas/auth.schema";

export function ResetPasswordForm() {
  const resetPassword = useResetPassword();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = form.watch("password");

  return (
    <FormWrapper
      form={form}
      onSubmit={(values) => resetPassword.mutate(values)}
      className="auth-form"
    >
      <AuthFormField id="password" label="New password" error={form.formState.errors.password}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="Enter a new password"
          disabled={resetPassword.isPending}
          {...form.register("password")}
        />
        <PasswordStrengthMeter password={passwordValue} />
      </AuthFormField>

      <AuthFormField
        id="confirmPassword"
        label="Confirm new password"
        error={form.formState.errors.confirmPassword}
      >
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="Confirm your new password"
          disabled={resetPassword.isPending}
          {...form.register("confirmPassword")}
        />
      </AuthFormField>

      <AuthSubmitButton isLoading={resetPassword.isPending} loadingLabel="Updating…">
        Update password
      </AuthSubmitButton>
    </FormWrapper>
  );
}
