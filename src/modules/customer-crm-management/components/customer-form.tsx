"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerRegistrationInput } from "@/modules/customer-crm-management/types/customer-crm-types";
import type { CustomerStatus } from "@prisma/client";

interface CustomerFormProps {
  initial?: CustomerRegistrationInput;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (input: CustomerRegistrationInput) => Promise<void>;
}

export function CustomerForm({
  initial,
  submitLabel,
  disabled = false,
  onSubmit,
}: CustomerFormProps) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(initial?.dateOfBirth ?? "");
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [preferredLanguage, setPreferredLanguage] = useState(initial?.preferredLanguage ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [marketingConsent, setMarketingConsent] = useState(initial?.marketingConsent ?? false);
  const [status, setStatus] = useState<CustomerStatus>(initial?.status ?? "ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        preferredLanguage: preferredLanguage || null,
        notes: notes || null,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        marketingConsent,
        status,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
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
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Input id="gender" value={gender} onChange={(e) => setGender(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredLanguage">Preferred language</Label>
          <Input
            id="preferredLanguage"
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as CustomerStatus)}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => setMarketingConsent(e.target.checked)}
        />
        Marketing consent
      </label>

      <Button type="submit" disabled={disabled || isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
