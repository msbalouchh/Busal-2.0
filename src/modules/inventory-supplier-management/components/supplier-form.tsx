"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplierInput } from "@/modules/inventory-supplier-management/types/inventory-supplier-types";
import type { SupplierStatus } from "@prisma/client";

interface SupplierFormProps {
  initial?: SupplierInput;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (input: SupplierInput) => Promise<void>;
}

export function SupplierForm({
  initial,
  submitLabel,
  disabled = false,
  onSubmit,
}: SupplierFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [contactPerson, setContactPerson] = useState(initial?.contactPerson ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<SupplierStatus>(initial?.status ?? "ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        website: website || null,
        address: address || null,
        city: city || null,
        country: country || null,
        notes: notes || null,
        status,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Supplier name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPerson">Contact person</Label>
          <Input
            id="contactPerson"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as SupplierStatus)}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>
      <Button type="submit" disabled={disabled || isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
