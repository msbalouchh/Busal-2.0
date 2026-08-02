"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCustomerProfileAction } from "@/modules/customer-portal/actions/customer-portal-actions";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";
import type { CustomerPortalContextData } from "@/services/customer-portal.service";

interface CustomerPortalProfilePanelProps {
  context: CustomerPortalContextData;
}

export function CustomerPortalProfilePanel({ context }: CustomerPortalProfilePanelProps) {
  const [isPending, startTransition] = useTransition();
  const { customer } = context;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Status:</span> {customer.status}
          </p>
          <p>
            <span className="text-muted-foreground">Loyalty points:</span>{" "}
            {customer.loyaltyPoints.toLocaleString()}
          </p>
          <p>
            <span className="text-muted-foreground">Total orders:</span> {customer.totalOrders}
          </p>
          <p>
            <span className="text-muted-foreground">Total spend:</span>{" "}
            {customer.totalSpendFormatted}
          </p>
          <p>
            <span className="text-muted-foreground">Average order:</span>{" "}
            {customer.averageOrderValueFormatted}
          </p>
          <p>
            <span className="text-muted-foreground">Last order:</span>{" "}
            {formatPortalDate(customer.lastOrderAt)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              startTransition(async () => {
                try {
                  await updateCustomerProfileAction({
                    name: String(formData.get("name") ?? ""),
                    phone: String(formData.get("phone") ?? "") || null,
                    preferredLanguage: String(formData.get("preferredLanguage") ?? "") || null,
                    marketingConsent: formData.get("marketingConsent") === "on",
                  });
                  toast.success("Profile updated");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to update profile.");
                }
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={customer.name}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={customer.email ?? context.userEmail} disabled readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={customer.phone ?? ""}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredLanguage">Preferred language</Label>
              <Input
                id="preferredLanguage"
                name="preferredLanguage"
                defaultValue={customer.preferredLanguage ?? "en"}
                disabled={isPending}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="marketingConsent"
                defaultChecked={customer.marketingConsent}
                disabled={isPending}
              />
              Receive marketing updates
            </label>
            <Button type="submit" disabled={isPending}>
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
