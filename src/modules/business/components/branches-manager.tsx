"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBranchAction,
  deleteBranchAction,
  updateBranchAction,
} from "@/modules/business/actions/business-actions";
import type { BranchData } from "@/services/business-management.service";

interface BranchesManagerProps {
  branches: BranchData[];
}

interface BranchFormState {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  isMain: boolean;
}

const emptyForm: BranchFormState = {
  name: "",
  address: "",
  city: "",
  country: "",
  phone: "",
  isMain: false,
};

export function BranchesManager({ branches }: BranchesManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (branch: BranchData) => {
    setEditingId(branch.id);
    setShowForm(true);
    setForm({
      name: branch.name,
      address: branch.address ?? "",
      city: branch.city ?? "",
      country: branch.country ?? "",
      phone: branch.phone ?? "",
      isMain: branch.isMain,
    });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Branch name is required");
      return;
    }

    startTransition(async () => {
      try {
        if (editingId) {
          await updateBranchAction(editingId, form);
          toast.success("Branch updated");
        } else {
          await createBranchAction(form);
          toast.success("Branch created");
        }
        resetForm();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save branch");
      }
    });
  };

  const handleDelete = (branchId: string) => {
    startTransition(async () => {
      try {
        await deleteBranchAction(branchId);
        toast.success("Branch deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete branch");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm(true)} disabled={isPending || showForm}>
          <Plus className="h-4 w-4" />
          Add branch
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="branch-name">Branch name</Label>
              <Input
                id="branch-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="branch-address">Address</Label>
              <Input
                id="branch-address"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-city">City</Label>
              <Input
                id="branch-city"
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-country">Country</Label>
              <Input
                id="branch-country"
                value={form.country}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-phone">Phone</Label>
              <Input
                id="branch-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="branch-main"
                type="checkbox"
                checked={form.isMain}
                onChange={(event) => setForm({ ...form, isMain: event.target.checked })}
                disabled={isPending}
              />
              <Label htmlFor="branch-main">Set as main branch</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? "Update branch" : "Create branch"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1 text-sm">
              <p className="font-semibold">
                {branch.name}
                {branch.isMain ? " (Main)" : ""}
              </p>
              <p className="text-muted-foreground">
                {[branch.address, branch.city, branch.country].filter(Boolean).join(", ") ||
                  "No address"}
              </p>
              {branch.phone ? <p className="text-muted-foreground">{branch.phone}</p> : null}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => startEdit(branch)}
                disabled={isPending}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDelete(branch.id)}
                disabled={isPending || branch.isMain}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
