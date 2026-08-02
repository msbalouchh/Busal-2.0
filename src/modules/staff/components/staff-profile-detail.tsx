"use client";

import { Loader2, Lock, Shield, Unlock } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateStaffProfileAction,
  updateStaffSecurityAction,
} from "@/modules/staff/actions/staff-management-actions";
import {
  ACCOUNT_STATUS_OPTIONS,
  DEPARTMENT_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
} from "@/modules/staff/constants/staff-management";
import { StaffActivityTimeline } from "@/modules/staff/components/staff-activity-timeline";
import { getStaffInitials } from "@/modules/staff/utils/staff-profile";
import type {
  SerializedStaffMember,
  StaffAuditEntry,
  StaffManagementPermissions,
} from "@/modules/staff/types/staff-management-types";
import type { BranchData, RoleData } from "@/services/staff-management.service";
import { cn } from "@/lib/utils";

interface StaffProfileDetailProps {
  member: SerializedStaffMember;
  activity: StaffAuditEntry[];
  branches: BranchData[];
  roles: RoleData[];
  permissions: StaffManagementPermissions;
}

export function StaffProfileDetail({
  member,
  activity,
  branches,
  roles,
  permissions,
}: StaffProfileDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email ?? "",
    phone: member.phone ?? "",
    employeeCode: member.employeeCode ?? "",
    department: member.department ?? "",
    jobTitle: member.jobTitle ?? "",
    employmentStatus: member.employmentStatus,
    roleId: member.roles[0]?.id ?? "",
    branchId: member.branchId ?? "",
    notes: member.profile.notes,
    emergencyName: member.profile.emergencyContact.name,
    emergencyPhone: member.profile.emergencyContact.phone,
    emergencyRelationship: member.profile.emergencyContact.relationship,
  });

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateStaffProfileAction(member.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          employeeCode: form.employeeCode,
          department: form.department,
          jobTitle: form.jobTitle,
          employmentStatus: form.employmentStatus,
          roleId: form.roleId || null,
          branchId: form.branchId || null,
          branchIds: form.branchId ? [form.branchId] : [],
          defaultBranchId: form.branchId || null,
          profile: {
            notes: form.notes,
            emergencyContact: {
              name: form.emergencyName,
              phone: form.emergencyPhone,
              relationship: form.emergencyRelationship,
            },
          },
        });
        toast.success("Staff profile saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save staff profile");
      }
    });
  };

  const handleSecurity = (action: "lock" | "suspend" | "reactivate" | "reset") => {
    startTransition(async () => {
      try {
        await updateStaffSecurityAction(member.id, {
          lockAccount: action === "lock",
          suspend: action === "suspend",
          reactivate: action === "reactivate",
          forcePasswordReset: action === "reset",
        });
        toast.success("Security settings updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update security");
      }
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <section className="rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold">
              {getStaffInitials(member.firstName, member.lastName)}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {member.firstName} {member.lastName}
              </h2>
              <p className="text-muted-foreground text-sm">
                {member.roles[0]?.name ?? "No role"} · {member.jobTitle || "No job title"}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border p-4">
          <h3 className="text-lg font-semibold">Personal information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-first-name">First name</Label>
              <Input
                id="profile-first-name"
                value={form.firstName}
                disabled={isPending || !permissions.canUpdate}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-last-name">Last name</Label>
              <Input
                id="profile-last-name"
                value={form.lastName}
                disabled={isPending || !permissions.canUpdate}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-employee-id">Employee ID</Label>
              <Input
                id="profile-employee-id"
                value={form.employeeCode}
                disabled={isPending || !permissions.canUpdate}
                onChange={(event) => setForm({ ...form, employeeCode: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-job-title">Job title</Label>
              <Input
                id="profile-job-title"
                value={form.jobTitle}
                disabled={isPending || !permissions.canUpdate}
                onChange={(event) => setForm({ ...form, jobTitle: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={form.email}
                disabled={isPending || !permissions.canUpdate}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                value={form.phone}
                disabled={isPending || !permissions.canUpdate}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-department">Department</Label>
              <select
                id="profile-department"
                value={form.department}
                disabled={isPending || !permissions.canUpdate}
                className={cn(
                  "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                )}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
              >
                <option value="">Select department</option>
                {DEPARTMENT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-employment-status">Employment status</Label>
              <select
                id="profile-employment-status"
                value={form.employmentStatus}
                disabled={isPending || !permissions.canUpdate}
                className={cn(
                  "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                )}
                onChange={(event) =>
                  setForm({
                    ...form,
                    employmentStatus: event.target.value as typeof form.employmentStatus,
                  })
                }
              >
                {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-role">Role</Label>
              <select
                id="profile-role"
                value={form.roleId}
                disabled={isPending || !permissions.canUpdate}
                className={cn(
                  "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                )}
                onChange={(event) => setForm({ ...form, roleId: event.target.value })}
              >
                <option value="">No role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-branch">Default branch</Label>
              <select
                id="profile-branch"
                value={form.branchId}
                disabled={isPending || !permissions.canUpdate}
                className={cn(
                  "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                )}
                onChange={(event) => setForm({ ...form, branchId: event.target.value })}
              >
                <option value="">No branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border p-4">
          <h3 className="text-lg font-semibold">Emergency contact</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergency-name">Name</Label>
              <Input
                id="emergency-name"
                value={form.emergencyName}
                disabled={isPending || !permissions.canUpdate}
                onChange={(event) => setForm({ ...form, emergencyName: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency-phone">Phone</Label>
              <Input
                id="emergency-phone"
                value={form.emergencyPhone}
                disabled={isPending || !permissions.canUpdate}
                onChange={(event) => setForm({ ...form, emergencyPhone: event.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="emergency-relationship">Relationship</Label>
              <Input
                id="emergency-relationship"
                value={form.emergencyRelationship}
                disabled={isPending || !permissions.canUpdate}
                onChange={(event) =>
                  setForm({ ...form, emergencyRelationship: event.target.value })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile-notes">Notes</Label>
              <textarea
                id="profile-notes"
                rows={4}
                value={form.notes}
                disabled={isPending || !permissions.canUpdate}
                className={cn(
                  "border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                )}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </div>
          </div>
          {permissions.canUpdate ? (
            <Button type="button" disabled={isPending} onClick={handleSave}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save profile
            </Button>
          ) : null}
        </section>
      </div>

      <div className="space-y-6">
        <section className="space-y-4 rounded-lg border p-4">
          <h3 className="text-lg font-semibold">Security</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Account status:</span>{" "}
              {
                ACCOUNT_STATUS_OPTIONS.find((option) => option.value === member.accountStatus)
                  ?.label
              }
            </p>
            <p>
              <span className="text-muted-foreground">MFA:</span>{" "}
              {member.mfaEnabled ? "Enabled" : "Not enabled"}
            </p>
            <p>
              <span className="text-muted-foreground">Active sessions:</span>{" "}
              {member.activeSessionCount}
            </p>
            <p>
              <span className="text-muted-foreground">Last login:</span>{" "}
              {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString() : "Never"}
            </p>
          </div>
          {permissions.canManageSecurity ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleSecurity("lock")}
              >
                <Lock className="h-4 w-4" />
                Lock
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleSecurity("suspend")}
              >
                Suspend
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleSecurity("reactivate")}
              >
                <Unlock className="h-4 w-4" />
                Reactivate
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleSecurity("reset")}
              >
                <Shield className="h-4 w-4" />
                Force reset
              </Button>
            </div>
          ) : null}
        </section>

        <StaffActivityTimeline entries={activity} title="Activity" />
      </div>
    </div>
  );
}
