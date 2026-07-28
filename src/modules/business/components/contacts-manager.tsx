"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createContactAction,
  deleteContactAction,
  updateContactAction,
} from "@/modules/business/actions/business-actions";
import { CONTACT_TYPE_OPTIONS, type ContactTypeValue } from "@/modules/business/constants/routes";
import type { BusinessContactData } from "@/services/business-management.service";
import { cn } from "@/lib/utils";

interface ContactsManagerProps {
  contacts: BusinessContactData[];
}

interface ContactFormState {
  type: ContactTypeValue;
  label: string;
  value: string;
  isPrimary: boolean;
}

const emptyForm: ContactFormState = {
  type: "PHONE",
  label: "",
  value: "",
  isPrimary: false,
};

export function ContactsManager({ contacts }: ContactsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContactFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (contact: BusinessContactData) => {
    setEditingId(contact.id);
    setShowForm(true);
    setForm({
      type: contact.type as ContactTypeValue,
      label: contact.label ?? "",
      value: contact.value,
      isPrimary: contact.isPrimary,
    });
  };

  const handleSubmit = () => {
    if (!form.value.trim()) {
      toast.error("Contact value is required");
      return;
    }

    startTransition(async () => {
      try {
        if (editingId) {
          await updateContactAction(editingId, form);
          toast.success("Contact updated");
        } else {
          await createContactAction(form);
          toast.success("Contact created");
        }
        resetForm();
      } catch {
        toast.error("Unable to save contact");
      }
    });
  };

  const handleDelete = (contactId: string) => {
    startTransition(async () => {
      try {
        await deleteContactAction(contactId);
        toast.success("Contact deleted");
      } catch {
        toast.error("Unable to delete contact");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm(true)} disabled={isPending || showForm}>
          <Plus className="h-4 w-4" />
          Add contact
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-type">Type</Label>
              <select
                id="contact-type"
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value as ContactTypeValue })
                }
                disabled={isPending}
                className={cn(
                  "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                )}
              >
                {CONTACT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-label">Label</Label>
              <Input
                id="contact-label"
                value={form.label}
                onChange={(event) => setForm({ ...form, label: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="contact-value">Value</Label>
              <Input
                id="contact-value"
                value={form.value}
                onChange={(event) => setForm({ ...form, value: event.target.value })}
                disabled={isPending}
              />
            </div>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(event) => setForm({ ...form, isPrimary: event.target.checked })}
                disabled={isPending}
              />
              <span className="text-sm">Primary contact</span>
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? "Update contact" : "Create contact"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {contacts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No contact details yet.</p>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1 text-sm">
                <p className="font-semibold">
                  {contact.label || contact.type}
                  {contact.isPrimary ? " (Primary)" : ""}
                </p>
                <p className="text-muted-foreground">{contact.value}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(contact)}
                  disabled={isPending}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(contact.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
