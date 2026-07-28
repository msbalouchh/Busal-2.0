"use client";

import { Loader2, Pencil, Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createStaffMemberAction,
  deleteStaffMemberAction,
  setStaffActiveStatusAction,
  updateStaffMemberAction,
} from "@/modules/staff/actions/staff-actions";
import type { BranchData, RoleData, StaffData } from "@/services/staff-management.service";

interface StaffMembersManagerProps {
  members: StaffData[];
  branches: BranchData[];
  roles: RoleData[];
}

interface StaffFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  branchId: string;
  roleId: string;
  isActive: boolean;
}

const emptyForm: StaffFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  branchId: "",
  roleId: "",
  isActive: true,
};

export function StaffMembersManager({ members, branches, roles }: StaffMembersManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (member: StaffData) => {
    setEditingId(member.id);
    setShowForm(true);
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email ?? "",
      phone: member.phone ?? "",
      branchId: member.branchId ?? "",
      roleId: member.roles[0]?.id ?? "",
      isActive: member.isActive,
    });
  };

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || undefined,
      phone: form.phone || undefined,
      branchId: form.branchId || null,
      roleId: form.roleId || null,
      isActive: form.isActive,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          await updateStaffMemberAction(editingId, payload);
          toast.success("Staff member updated");
        } else {
          await createStaffMemberAction(payload);
          toast.success("Staff member created");
        }
        resetForm();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save staff member");
      }
    });
  };

  const handleDelete = (staffId: string) => {
    startTransition(async () => {
      try {
        await deleteStaffMemberAction(staffId);
        toast.success("Staff member deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete staff member");
      }
    });
  };

  const handleToggleActive = (staffId: string, isActive: boolean) => {
    startTransition(async () => {
      try {
        await setStaffActiveStatusAction(staffId, isActive);
        toast.success(isActive ? "Staff member activated" : "Staff member deactivated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update status");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm(true)} disabled={isPending || showForm}>
          <Plus className="h-4 w-4" />
          Add member
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staff-first-name">First name</Label>
              <Input
                id="staff-first-name"
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-last-name">Last name</Label>
              <Input
                id="staff-last-name"
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone">Phone</Label>
              <Input
                id="staff-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-branch">Branch</Label>
              <select
                id="staff-branch"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={form.branchId}
                onChange={(event) => setForm({ ...form, branchId: event.target.value })}
                disabled={isPending}
              >
                <option value="">No branch assigned</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                    {branch.isMain ? " (Main)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">Role</Label>
              <select
                id="staff-role"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={form.roleId}
                onChange={(event) => setForm({ ...form, roleId: event.target.value })}
                disabled={isPending}
              >
                <option value="">No role assigned</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                    {role.isSystem ? " (System)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="staff-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                disabled={isPending}
              />
              <Label htmlFor="staff-active">Active</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? "Update member" : "Create member"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No staff members yet. Add your first team member.
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1 text-sm">
                <p className="font-semibold">
                  {member.firstName} {member.lastName}
                  {!member.isActive ? (
                    <span className="text-muted-foreground ml-2 font-normal">(Inactive)</span>
                  ) : null}
                </p>
                <p className="text-muted-foreground">
                  {member.roles[0]?.name ?? "No role"}
                  {member.branch ? ` · ${member.branch.name}` : ""}
                </p>
                {(member.email || member.phone) && (
                  <p className="text-muted-foreground">
                    {[member.email, member.phone].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(member)}
                  disabled={isPending}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(member.id, !member.isActive)}
                  disabled={isPending}
                >
                  {member.isActive ? (
                    <>
                      <UserX className="h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Activate
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(member.id)}
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
