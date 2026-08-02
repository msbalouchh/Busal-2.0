"use client";

import { Loader2, Pencil, Plus, Star } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBusinessBranchAction,
  disableBusinessBranchAction,
  setDefaultBusinessBranchAction,
  updateBusinessBranchAction,
} from "@/modules/business/actions/business-profile-actions";
import type { SerializedBusinessProfile } from "@/modules/business/types/business-profile-types";
import type { BranchData } from "@/services/business-management.service";

interface BusinessBranchesPanelProps {
  profile: SerializedBusinessProfile;
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

export function BusinessBranchesPanel({ profile }: BusinessBranchesPanelProps) {
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
    if (!profile.canManageBranches) {
      toast.error("You do not have permission to manage branches.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Branch name is required");
      return;
    }

    startTransition(async () => {
      try {
        if (editingId) {
          await updateBusinessBranchAction(editingId, form);
          toast.success("Branch updated");
        } else {
          await createBusinessBranchAction(form);
          toast.success("Branch created");
        }
        resetForm();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save branch");
      }
    });
  };

  const handleDisable = (branchId: string) => {
    startTransition(async () => {
      try {
        await disableBusinessBranchAction(branchId);
        toast.success("Branch disabled");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to disable branch");
      }
    });
  };

  const handleSetDefault = (branchId: string) => {
    startTransition(async () => {
      try {
        await setDefaultBusinessBranchAction(branchId);
        toast.success("Default branch updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to set default branch");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={isPending || showForm || !profile.canManageBranches}
        >
          <Plus className="h-4 w-4" />
          Create branch
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
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                id="branch-main"
                type="checkbox"
                checked={form.isMain}
                onChange={(event) => setForm({ ...form, isMain: event.target.checked })}
                disabled={isPending}
              />
              <Label htmlFor="branch-main">Set as default branch</Label>
            </label>
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
        {profile.branches.map((branch) => (
          <div
            key={branch.id}
            className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1 text-sm">
              <p className="font-semibold">
                {branch.name}
                {branch.isMain ? " (Default)" : ""}
              </p>
              <p className="text-muted-foreground">
                {[branch.address, branch.city, branch.country].filter(Boolean).join(", ") ||
                  "No address"}
              </p>
              {branch.phone ? <p className="text-muted-foreground">{branch.phone}</p> : null}
              <p className="text-muted-foreground">
                Status: {branch.isActive === false ? "Disabled" : "Active"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => startEdit(branch)}
                disabled={isPending || !profile.canManageBranches}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              {!branch.isMain ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetDefault(branch.id)}
                  disabled={isPending || !profile.canManageBranches || branch.isActive === false}
                >
                  <Star className="h-4 w-4" />
                  Set default
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDisable(branch.id)}
                disabled={
                  isPending ||
                  branch.isMain ||
                  !profile.canManageBranches ||
                  branch.isActive === false
                }
              >
                Disable
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
