"use client";

import { useTransition } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteCustomerAddressAction,
  saveCustomerAddressAction,
} from "@/modules/customer-portal/actions/customer-portal-actions";

import type { CustomerAddressList } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalAddressesPanelProps {
  addresses: CustomerAddressList;
}

export function CustomerPortalAddressesPanel({ addresses }: CustomerPortalAddressesPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add address</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              startTransition(async () => {
                try {
                  await saveCustomerAddressAction({
                    label: String(formData.get("label") ?? "") || null,
                    addressLine1: String(formData.get("addressLine1") ?? ""),
                    addressLine2: String(formData.get("addressLine2") ?? "") || null,
                    city: String(formData.get("city") ?? "") || null,
                    postcode: String(formData.get("postcode") ?? "") || null,
                    country: String(formData.get("country") ?? "") || null,
                    isDefault: formData.get("isDefault") === "on",
                  });
                  event.currentTarget.reset();
                  toast.success("Address saved");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to save address.");
                }
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input id="label" name="label" placeholder="Home" disabled={isPending} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="addressLine1">Address line 1</Label>
              <Input id="addressLine1" name="addressLine1" required disabled={isPending} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="addressLine2">Address line 2</Label>
              <Input id="addressLine2" name="addressLine2" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input id="postcode" name="postcode" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" disabled={isPending} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="isDefault" disabled={isPending} />
              Set as default
            </label>
            <Button type="submit" disabled={isPending} className="sm:col-span-2">
              Add address
            </Button>
          </form>
        </CardContent>
      </Card>

      {addresses.length === 0 ? (
        <EmptyState
          title="No saved addresses"
          description="Add a delivery address using the form above."
          icon={<MapPin className="text-muted-foreground h-6 w-6" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {address.label ?? "Address"}
                  {address.isDefault ? <Badge>Default</Badge> : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{address.addressLine1}</p>
                {address.addressLine2 ? <p>{address.addressLine2}</p> : null}
                <p className="text-muted-foreground">
                  {[address.city, address.postcode, address.country].filter(Boolean).join(", ")}
                </p>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await deleteCustomerAddressAction(address.id);
                        toast.success("Address deleted");
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Unable to delete address.",
                        );
                      }
                    })
                  }
                >
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
