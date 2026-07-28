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
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground text-sm">
          If an account exists for{" "}
          <span className="text-foreground font-medium">{form.getValues("email")}</span>, you will
          receive a password reset link shortly.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href={ROUTES.login}>Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

        <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
          {forgotPassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Send reset link
        </Button>
      </FormWrapper>

      <p className="text-muted-foreground text-center text-sm">
        Remember your password?{" "}
        <Link href={ROUTES.login} className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
