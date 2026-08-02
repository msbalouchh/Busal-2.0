"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertCustomerAddressAction } from "@/modules/customer-crm-management/actions/customer-crm-actions";
import type { CustomerAddressRecord } from "@/modules/customer-crm-management/types/customer-crm-types";

interface AddressManagerPanelProps {
  customerId: string;
  addresses: CustomerAddressRecord[];
}

export function AddressManagerPanel({ customerId, addresses }: AddressManagerPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await upsertCustomerAddressAction(customerId, {
          label: label || null,
          addressLine1,
          addressLine2: addressLine2 || null,
          city: city || null,
          postcode: postcode || null,
          country: country || null,
          isDefault,
        });
        toast.success("Address saved");
        setLabel("");
        setAddressLine1("");
        setAddressLine2("");
        setCity("");
        setPostcode("");
        setCountry("");
        setIsDefault(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save address");
      }
    });
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Addresses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {addresses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No saved addresses.</p>
        ) : (
          addresses.map((address) => (
            <div key={address.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">{address.label ?? "Address"}</p>
                {address.isDefault ? (
                  <span className="text-primary text-xs font-medium">Default</span>
                ) : null}
              </div>
              <p>{address.addressLine1}</p>
              {address.addressLine2 ? <p>{address.addressLine2}</p> : null}
              <p className="text-muted-foreground">
                {[address.city, address.postcode, address.country].filter(Boolean).join(", ")}
              </p>
            </div>
          ))
        )}

        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Add address</p>
          <div className="space-y-2">
            <Label htmlFor="addressLabel">Label</Label>
            <Input id="addressLabel" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input
              id="addressLine1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address line 2</Label>
            <Input
              id="addressLine2"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input id="postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            Set as default
          </label>
          <Button onClick={handleSubmit} disabled={isPending || !addressLine1.trim()}>
            Save address
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
