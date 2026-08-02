"use client";

import { Loader2, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createRbacRoleAction,
  deleteRbacRoleAction,
  updateRbacRoleAction,
} from "@/modules/rbac/actions/rbac-actions";
import type { RbacManagementPermissions } from "@/modules/rbac/lib/get-rbac-context";
import type { RoleData } from "@/services/staff-management.service";

interface RbacRolesPanelProps {
  roles: RoleData[];
  permissions: RbacManagementPermissions;
}

interface RoleFormState {
  name: string;
  description: string;
}

const emptyForm: RoleFormState = { name: "", description: "" };

export function RbacRolesPanel({ roles, permissions }: RbacRolesPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
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
          await updateRbacRoleAction(editingId, payload);
          toast.success("Role updated");
        } else {
          await createRbacRoleAction(payload);
          toast.success("Custom role created");
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
        await deleteRbacRoleAction(roleId);
        toast.success("Role deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete role");
      }
    });
  };

  return (
    <div className="space-y-6" aria-label="Roles list">
      {permissions.canCreate ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={isPending || showForm}
            aria-label="Create custom role"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create custom role
          </Button>
        </div>
      ) : null}

      {showForm ? (
        <form
          className="space-y-4 rounded-lg border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
          aria-label={editingId ? "Edit role form" : "Create role form"}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rbac-role-name">Role name</Label>
              <Input
                id="rbac-role-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                disabled={isPending}
                required
                aria-required="true"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rbac-role-description">Description</Label>
              <Input
                id="rbac-role-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                disabled={isPending}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {editingId ? "Update role" : "Create role"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <ul className="space-y-3" role="list" aria-label="Business roles">
        {roles.map((role) => (
          <li
            key={role.id}
            className="focus-within:ring-ring flex flex-col gap-3 rounded-lg border p-4 focus-within:ring-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1 text-sm">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {role.name}
                {role.isSystem ? (
                  <span
                    className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-normal"
                    aria-label="System role"
                  >
                    <Lock className="h-3 w-3" aria-hidden="true" />
                    System
                  </span>
                ) : (
                  <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-normal">
                    Custom
                  </span>
                )}
              </p>
              <p className="text-muted-foreground">{role.description || "No description"}</p>
              <p className="text-muted-foreground">
                {role.permissionCount} permissions · {role.staffCount} members
              </p>
            </div>
            {!role.isSystem && permissions.canUpdate ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  aria-label={`Edit ${role.name}`}
                  onClick={() => {
                    setEditingId(role.id);
                    setShowForm(true);
                    setForm({ name: role.name, description: role.description ?? "" });
                  }}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Button>
                {permissions.canDelete ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending || role.staffCount > 0}
                    aria-label={`Delete ${role.name}`}
                    onClick={() => handleDelete(role.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">System roles cannot be deleted</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
