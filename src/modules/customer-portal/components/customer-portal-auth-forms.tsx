"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FormWrapper } from "@/components/common/form-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthFormField } from "@/modules/auth/components/auth-form-field";
import { PasswordInput } from "@/modules/auth/components/password-input";
import { CUSTOMER_PORTAL_ROUTES } from "@/modules/customer-portal/constants/routes";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, "Enter your full name"),
  businessCode: z.string().min(2, "Enter your business code"),
  phone: z.string().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function CustomerPortalLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? CUSTOMER_PORTAL_ROUTES.dashboard;
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/portal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, redirectTo }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        redirectPath?: string;
      };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Unable to sign in.");
      }
      toast.success("Welcome back!");
      router.push(payload.redirectPath ?? redirectTo);
      router.refresh();
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Unable to sign in.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <FormWrapper form={form} onSubmit={onSubmit}>
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
            disabled={loading}
            {...form.register("email")}
          />
        </AuthFormField>
        <AuthFormField id="password" label="Password" error={form.formState.errors.password}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            disabled={loading}
            {...form.register("password")}
          />
        </AuthFormField>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </FormWrapper>
      <p className="text-muted-foreground text-center text-sm">
        New customer?{" "}
        <Link
          href={CUSTOMER_PORTAL_ROUTES.register}
          className="text-primary font-medium hover:underline"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}

export function CustomerPortalRegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      businessCode: "",
      phone: "",
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/portal/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        redirectPath?: string;
      };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Unable to register.");
      }
      toast.success("Account created!");
      router.push(payload.redirectPath ?? CUSTOMER_PORTAL_ROUTES.dashboard);
      router.refresh();
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Unable to register.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <FormWrapper form={form} onSubmit={onSubmit}>
        {form.formState.errors.root ? (
          <p
            className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
            role="alert"
          >
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <AuthFormField id="fullName" label="Full name" error={form.formState.errors.fullName}>
          <Input id="fullName" disabled={loading} {...form.register("fullName")} />
        </AuthFormField>
        <AuthFormField
          id="businessCode"
          label="Business code"
          error={form.formState.errors.businessCode}
        >
          <Input id="businessCode" disabled={loading} {...form.register("businessCode")} />
        </AuthFormField>
        <AuthFormField id="email" label="Email" error={form.formState.errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            disabled={loading}
            {...form.register("email")}
          />
        </AuthFormField>
        <AuthFormField id="phone" label="Phone (optional)" error={form.formState.errors.phone}>
          <Input id="phone" type="tel" disabled={loading} {...form.register("phone")} />
        </AuthFormField>
        <AuthFormField id="password" label="Password" error={form.formState.errors.password}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            disabled={loading}
            {...form.register("password")}
          />
        </AuthFormField>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create account
        </Button>
      </FormWrapper>
      <p className="text-muted-foreground text-center text-sm">
        Already registered?{" "}
        <Link
          href={CUSTOMER_PORTAL_ROUTES.login}
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
