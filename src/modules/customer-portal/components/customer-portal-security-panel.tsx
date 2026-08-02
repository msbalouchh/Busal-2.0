"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { updateCustomerPasswordAction } from "@/modules/customer-portal/actions/customer-portal-actions";
import { PasswordInput } from "@/modules/auth/components/password-input";

export function CustomerPortalSecurityPanel() {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const password = String(formData.get("password") ?? "");
            const confirm = String(formData.get("confirmPassword") ?? "");

            if (password !== confirm) {
              toast.error("Passwords do not match.");
              return;
            }

            startTransition(async () => {
              try {
                await updateCustomerPasswordAction(password);
                event.currentTarget.reset();
                toast.success("Password updated");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to update password.");
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <PasswordInput
              id="password"
              name="password"
              minLength={8}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              minLength={8}
              required
              disabled={isPending}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
