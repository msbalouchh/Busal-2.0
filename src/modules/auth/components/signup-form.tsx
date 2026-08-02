"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { AuthDivider } from "@/modules/auth/components/auth-divider";
import { AuthFormField } from "@/modules/auth/components/auth-form-field";
import { AuthSubmitButton } from "@/modules/auth/components/auth-submit-button";
import { GoogleSignInButton } from "@/modules/auth/components/google-sign-in-button";
import { PasswordInput } from "@/modules/auth/components/password-input";
import { PasswordStrengthMeter } from "@/modules/auth/components/password-strength-meter";
import { useSignup } from "@/modules/auth/hooks/use-auth";
import { signupSchema, type SignupFormValues } from "@/schemas/auth.schema";

export function SignupForm() {
  const signup = useSignup();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      businessName: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const passwordValue = form.watch("password");

  return (
    <div className="auth-form">
      <FormWrapper form={form} onSubmit={(values) => signup.mutate(values)}>
        <AuthFormField
          id="businessName"
          label="Business name"
          error={form.formState.errors.businessName}
        >
          <Input
            id="businessName"
            type="text"
            autoComplete="organization"
            placeholder="Harbour Kitchen Group"
            disabled={signup.isPending}
            {...form.register("businessName")}
          />
        </AuthFormField>

        <AuthFormField id="fullName" label="Full name" error={form.formState.errors.fullName}>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Sarah Chen"
            disabled={signup.isPending}
            {...form.register("fullName")}
          />
        </AuthFormField>

        <AuthFormField id="email" label="Business email" error={form.formState.errors.email}>
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
          <PasswordStrengthMeter password={passwordValue} />
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

        <div className="auth-terms">
          <Checkbox
            id="acceptTerms"
            disabled={signup.isPending}
            checked={form.watch("acceptTerms")}
            onChange={(event) =>
              form.setValue("acceptTerms", event.target.checked, { shouldValidate: true })
            }
          />
          <label htmlFor="acceptTerms">
            I accept the{" "}
            <Link href={MARKETING_ROUTES.terms} target="_blank" rel="noopener noreferrer">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href={MARKETING_ROUTES.privacy} target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
          </label>
        </div>
        {form.formState.errors.acceptTerms ? (
          <p className="auth-field__error" role="alert">
            {form.formState.errors.acceptTerms.message}
          </p>
        ) : null}

        <AuthSubmitButton isLoading={signup.isPending} loadingLabel="Creating workspace…">
          Create Workspace
        </AuthSubmitButton>
      </FormWrapper>

      <AuthDivider label="Or sign up with" />

      <GoogleSignInButton label="Continue with Google" />

      <p className="auth-footer-text">
        Already have an account? <Link href={ROUTES.login}>Sign in</Link>
      </p>
    </div>
  );
}
