"use client";

import type { StaffEmploymentStatus, StaffSalaryType } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  STAFF_DEPARTMENT_OPTIONS,
  STAFF_GENDER_OPTIONS,
  STAFF_SALARY_TYPE_OPTIONS,
} from "@/modules/staff-management/constants/routes";
import type { StaffManagementInput } from "@/modules/staff-management/types/staff-management-types";
import { EMPLOYMENT_STATUS_OPTIONS } from "@/modules/staff/constants/staff-management";
import type { SerializedStaffMember } from "@/modules/staff/types/staff-management-types";
import type { BranchData, RoleData } from "@/services/staff-management.service";

interface StaffFormProps {
  initialMember?: SerializedStaffMember | null;
  branches: BranchData[];
  roles: RoleData[];
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (input: StaffManagementInput) => Promise<void>;
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function buildInitialForm(member: SerializedStaffMember | null | undefined): StaffManagementInput {
  if (member) {
    return {
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email ?? "",
      phone: member.phone ?? "",
      employeeCode: member.employeeCode ?? "",
      jobTitle: member.jobTitle ?? "",
      department: member.department ?? "",
      employmentStatus: member.employmentStatus,
      avatar: member.avatar ?? "",
      dateOfBirth: toDateInput(member.dateOfBirth),
      gender: member.gender ?? "",
      hireDate: toDateInput(member.hireDate),
      terminationDate: toDateInput(member.terminationDate),
      salaryType: member.salaryType,
      hourlyRate: member.hourlyRate,
      monthlySalary: member.monthlySalary,
      notes: member.profile.notes,
      emergencyContact: member.profile.emergencyContact,
      roleIds: member.roles.map((role) => role.id),
      branchIds: member.branchAssignments.map((entry) => entry.branchId),
      primaryBranchId:
        member.branchAssignments.find((entry) => entry.isPrimary)?.branchId ??
        member.branchId ??
        null,
    };
  }

  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeCode: "",
    jobTitle: "",
    department: "",
    employmentStatus: "ACTIVE",
    avatar: "",
    dateOfBirth: "",
    gender: "",
    hireDate: "",
    terminationDate: "",
    salaryType: null,
    hourlyRate: null,
    monthlySalary: null,
    notes: "",
    emergencyContact: { name: "", phone: "", relationship: "" },
    roleIds: [],
    branchIds: [],
    primaryBranchId: null,
  };
}

export function StaffForm({
  initialMember,
  branches,
  roles,
  submitLabel,
  disabled = false,
  onSubmit,
}: StaffFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<StaffManagementInput>(() => buildInitialForm(initialMember));

  const toggleBranch = (branchId: string) => {
    setForm((current) => {
      const exists = current.branchIds?.includes(branchId);
      const branchIds = exists
        ? (current.branchIds ?? []).filter((id) => id !== branchId)
        : [...(current.branchIds ?? []), branchId];
      const primaryBranchId =
        current.primaryBranchId && branchIds.includes(current.primaryBranchId)
          ? current.primaryBranchId
          : (branchIds[0] ?? null);
      return { ...current, branchIds, primaryBranchId };
    });
  };

  const toggleRole = (roleId: string) => {
    setForm((current) => {
      const exists = current.roleIds?.includes(roleId);
      const roleIds = exists
        ? (current.roleIds ?? []).filter((id) => id !== roleId)
        : [...(current.roleIds ?? []), roleId];
      return { ...current, roleIds };
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        await onSubmit({
          ...form,
          dateOfBirth: form.dateOfBirth || null,
          hireDate: form.hireDate || null,
          terminationDate: form.terminationDate || null,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save staff member");
      }
    });
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit} aria-label="Staff form">
      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Personal information</h2>
          <p className="text-muted-foreground text-sm">Basic identity and contact details.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="staff-first-name">First name *</Label>
            <Input
              id="staff-first-name"
              required
              disabled={disabled || isPending}
              value={form.firstName}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-last-name">Last name *</Label>
            <Input
              id="staff-last-name"
              required
              disabled={disabled || isPending}
              value={form.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              disabled={disabled || isPending}
              value={form.email ?? ""}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-phone">Phone</Label>
            <Input
              id="staff-phone"
              disabled={disabled || isPending}
              value={form.phone ?? ""}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-employee-code">Employee code</Label>
            <Input
              id="staff-employee-code"
              disabled={disabled || isPending}
              value={form.employeeCode ?? ""}
              onChange={(event) => setForm({ ...form, employeeCode: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-gender">Gender</Label>
            <select
              id="staff-gender"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              disabled={disabled || isPending}
              value={form.gender ?? ""}
              onChange={(event) => setForm({ ...form, gender: event.target.value })}
            >
              {STAFF_GENDER_OPTIONS.map((option) => (
                <option key={option.value || "unset"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-dob">Date of birth</Label>
            <Input
              id="staff-dob"
              type="date"
              disabled={disabled || isPending}
              value={form.dateOfBirth ?? ""}
              onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-avatar">Avatar URL</Label>
            <Input
              id="staff-avatar"
              disabled={disabled || isPending}
              value={form.avatar ?? ""}
              onChange={(event) => setForm({ ...form, avatar: event.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Employment</h2>
          <p className="text-muted-foreground text-sm">Role, department, and employment status.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="staff-job-title">Job title</Label>
            <Input
              id="staff-job-title"
              disabled={disabled || isPending}
              value={form.jobTitle ?? ""}
              onChange={(event) => setForm({ ...form, jobTitle: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-department">Department</Label>
            <select
              id="staff-department"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              disabled={disabled || isPending}
              value={form.department ?? ""}
              onChange={(event) => setForm({ ...form, department: event.target.value })}
            >
              <option value="">Select department</option>
              {STAFF_DEPARTMENT_OPTIONS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-status">Status</Label>
            <select
              id="staff-status"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              disabled={disabled || isPending}
              value={form.employmentStatus ?? "ACTIVE"}
              onChange={(event) =>
                setForm({
                  ...form,
                  employmentStatus: event.target.value as StaffEmploymentStatus,
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
            <Label htmlFor="staff-hire-date">Hire date</Label>
            <Input
              id="staff-hire-date"
              type="date"
              disabled={disabled || isPending}
              value={form.hireDate ?? ""}
              onChange={(event) => setForm({ ...form, hireDate: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-termination-date">Termination date</Label>
            <Input
              id="staff-termination-date"
              type="date"
              disabled={disabled || isPending}
              value={form.terminationDate ?? ""}
              onChange={(event) => setForm({ ...form, terminationDate: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-salary-type">Salary type</Label>
            <select
              id="staff-salary-type"
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              disabled={disabled || isPending}
              value={form.salaryType ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  salaryType: (event.target.value || null) as StaffSalaryType | null,
                })
              }
            >
              <option value="">Not set</option>
              {STAFF_SALARY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-hourly-rate">Hourly rate</Label>
            <Input
              id="staff-hourly-rate"
              type="number"
              min="0"
              step="0.01"
              disabled={disabled || isPending}
              value={form.hourlyRate ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  hourlyRate: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-monthly-salary">Monthly salary</Label>
            <Input
              id="staff-monthly-salary"
              type="number"
              min="0"
              step="0.01"
              disabled={disabled || isPending}
              value={form.monthlySalary ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  monthlySalary: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Roles</h2>
          <p className="text-muted-foreground text-sm">Assign one or more RBAC roles.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <label
              key={role.id}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                disabled={disabled || isPending}
                checked={form.roleIds?.includes(role.id) ?? false}
                onChange={() => toggleRole(role.id)}
              />
              <span>{role.name}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Branches</h2>
          <p className="text-muted-foreground text-sm">
            Assign branches and choose a primary location.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <label
              key={branch.id}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                disabled={disabled || isPending}
                checked={form.branchIds?.includes(branch.id) ?? false}
                onChange={() => toggleBranch(branch.id)}
              />
              <span>{branch.name}</span>
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="staff-primary-branch">Primary branch</Label>
          <select
            id="staff-primary-branch"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            disabled={disabled || isPending}
            value={form.primaryBranchId ?? ""}
            onChange={(event) => setForm({ ...form, primaryBranchId: event.target.value || null })}
          >
            <option value="">Select primary branch</option>
            {(form.branchIds ?? []).map((branchId) => {
              const branch = branches.find((entry) => entry.id === branchId);
              return (
                <option key={branchId} value={branchId}>
                  {branch?.name ?? branchId}
                </option>
              );
            })}
          </select>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Emergency contact & notes</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="staff-emergency-name">Contact name</Label>
            <Input
              id="staff-emergency-name"
              disabled={disabled || isPending}
              value={form.emergencyContact?.name ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  emergencyContact: { ...form.emergencyContact, name: event.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-emergency-phone">Contact phone</Label>
            <Input
              id="staff-emergency-phone"
              disabled={disabled || isPending}
              value={form.emergencyContact?.phone ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  emergencyContact: { ...form.emergencyContact, phone: event.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="staff-emergency-relationship">Relationship</Label>
            <Input
              id="staff-emergency-relationship"
              disabled={disabled || isPending}
              value={form.emergencyContact?.relationship ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  emergencyContact: {
                    ...form.emergencyContact,
                    relationship: event.target.value,
                  },
                })
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="staff-notes">Notes</Label>
            <textarea
              id="staff-notes"
              className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
              disabled={disabled || isPending}
              value={form.notes ?? ""}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
