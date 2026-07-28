"use client";

import { Loader2, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCustomRoleAction,
  deleteCustomRoleAction,
  updateCustomRoleAction,
} from "@/modules/staff/actions/staff-actions";
import type { RoleData } from "@/services/staff-management.service";

interface StaffRolesManagerProps {
  roles: RoleData[];
}

interface RoleFormState {
  name: string;
  description: string;
}

const emptyForm: RoleFormState = {
  name: "",
  description: "",
};

export function StaffRolesManager({ roles }: StaffRolesManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (role: RoleData) => {
    if (role.isSystem) {
      return;
    }

    setEditingId(role.id);
    setShowForm(true);
    setForm({
      name: role.name,
      description: role.description ?? "",
    });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || undefined,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          await updateCustomRoleAction(editingId, payload);
          toast.success("Role updated");
        } else {
          await createCustomRoleAction(payload);
          toast.success("Role created");
        }
        resetForm();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save role");
      }
    });
  };

  const handleDelete = (roleId: string) => {
    startTransition(async () => {
      try {
        await deleteCustomRoleAction(roleId);
        toast.success("Role deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete role");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm(true)} disabled={isPending || showForm}>
          <Plus className="h-4 w-4" />
          Add custom role
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="role-name">Role name</Label>
              <Input
                id="role-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="role-description">Description</Label>
              <Input
                id="role-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                disabled={isPending}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? "Update role" : "Create role"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2 font-semibold">
                {role.name}
                {role.isSystem ? (
                  <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-normal">
                    <Lock className="h-3 w-3" />
                    System
                  </span>
                ) : null}
              </p>
              <p className="text-muted-foreground">{role.description || "No description"}</p>
              <p className="text-muted-foreground">
                {role.permissionCount} permissions · {role.staffCount} members
              </p>
            </div>
            {!role.isSystem ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(role)}
                  disabled={isPending}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(role.id)}
                  disabled={isPending || role.staffCount > 0}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">System roles are read-only</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
