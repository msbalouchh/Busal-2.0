"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Button } from "@/components/ui/button";
import { AuthFormField } from "@/modules/auth/components/auth-form-field";
import { PasswordInput } from "@/modules/auth/components/password-input";
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

  return (
    <FormWrapper form={form} onSubmit={(values) => resetPassword.mutate(values)}>
      <AuthFormField id="password" label="New password" error={form.formState.errors.password}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="Enter a new password"
          disabled={resetPassword.isPending}
          {...form.register("password")}
        />
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

      <p className="text-muted-foreground text-xs">
        Password must be at least 8 characters with uppercase, lowercase, number, and special
        character.
      </p>

      <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
        {resetPassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Update password
      </Button>
    </FormWrapper>
  );
}
