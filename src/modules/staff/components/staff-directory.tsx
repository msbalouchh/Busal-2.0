"use client";

import Link from "next/link";
import { Loader2, Search, UserPlus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  bulkUpdateStaffAction,
  queryStaffDirectoryAction,
} from "@/modules/staff/actions/staff-management-actions";
import { StaffEmptyState } from "@/modules/staff/components/staff-empty-state";
import {
  ACCOUNT_STATUS_OPTIONS,
  DEPARTMENT_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  STAFF_MANAGEMENT_ROUTES,
} from "@/modules/staff/constants/staff-management";
import { getStaffInitials } from "@/modules/staff/utils/staff-profile";
import type {
  SerializedStaffMember,
  StaffDirectoryResult,
  StaffManagementPermissions,
} from "@/modules/staff/types/staff-management-types";
import type { BranchData, RoleData } from "@/services/staff-management.service";
import { cn } from "@/lib/utils";

interface StaffDirectoryProps {
  initialDirectory: StaffDirectoryResult;
  branches: BranchData[];
  roles: RoleData[];
  permissions: StaffManagementPermissions;
}

export function StaffDirectory({
  initialDirectory,
  branches,
  roles,
  permissions,
}: StaffDirectoryProps) {
  const [isPending, startTransition] = useTransition();
  const [directory, setDirectory] = useState(initialDirectory);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "department" | "createdAt">("name");

  const allSelected = useMemo(
    () => directory.items.length > 0 && directory.items.every((item) => selectedIds.has(item.id)),
    [directory.items, selectedIds],
  );

  const loadDirectory = (page = directory.page) => {
    startTransition(async () => {
      try {
        const result = await queryStaffDirectoryAction({
          search: search || undefined,
          branchId: branchId || null,
          roleId: roleId || null,
          department: department || null,
          employmentStatus: (employmentStatus as SerializedStaffMember["employmentStatus"]) || null,
          sortBy,
          page,
        });
        setDirectory(result);
        setSelectedIds(new Set());
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load staff directory");
      }
    });
  };

  const toggleSelected = (staffId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(staffId)) {
        next.delete(staffId);
      } else {
        next.add(staffId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(directory.items.map((item) => item.id)));
  };

  const handleBulkAssignRole = (nextRoleId: string) => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one staff member");
      return;
    }

    startTransition(async () => {
      try {
        await bulkUpdateStaffAction({
          staffIds: Array.from(selectedIds),
          roleId: nextRoleId || null,
        });
        toast.success("Role assignment updated");
        loadDirectory();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Bulk role assignment failed");
      }
    });
  };

  const handleBulkBranch = (nextBranchId: string) => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one staff member");
      return;
    }

    startTransition(async () => {
      try {
        await bulkUpdateStaffAction({
          staffIds: Array.from(selectedIds),
          branchId: nextBranchId || null,
          defaultBranchId: nextBranchId || null,
        });
        toast.success("Branch assignment updated");
        loadDirectory();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Bulk branch assignment failed");
      }
    });
  };

  const handleBulkStatus = (isActive: boolean) => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one staff member");
      return;
    }

    startTransition(async () => {
      try {
        await bulkUpdateStaffAction({
          staffIds: Array.from(selectedIds),
          isActive,
        });
        toast.success(isActive ? "Staff activated" : "Staff deactivated");
        loadDirectory();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Bulk status update failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="staff-search">Search</Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
              <Input
                id="staff-search"
                value={search}
                placeholder="Search by name, email, employee ID..."
                className="pl-9"
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    loadDirectory(1);
                  }
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-branch-filter">Branch</Label>
            <select
              id="staff-branch-filter"
              value={branchId}
              className={cn(
                "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
              )}
              onChange={(event) => setBranchId(event.target.value)}
            >
              <option value="">All branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-role-filter">Role</Label>
            <select
              id="staff-role-filter"
              value={roleId}
              className={cn(
                "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
              )}
              onChange={(event) => setRoleId(event.target.value)}
            >
              <option value="">All roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-department-filter">Department</Label>
            <select
              id="staff-department-filter"
              value={department}
              className={cn(
                "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
              )}
              onChange={(event) => setDepartment(event.target.value)}
            >
              <option value="">All departments</option>
              {DEPARTMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-status-filter">Employment status</Label>
            <select
              id="staff-status-filter"
              value={employmentStatus}
              className={cn(
                "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
              )}
              onChange={(event) => setEmploymentStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-sort">Sort by</Label>
            <select
              id="staff-sort"
              value={sortBy}
              className={cn(
                "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
              )}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            >
              <option value="name">Name</option>
              <option value="department">Department</option>
              <option value="createdAt">Date added</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => loadDirectory(1)}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Apply filters
          </Button>
          {permissions.canInvite ? (
            <Button asChild>
              <Link href={STAFF_MANAGEMENT_ROUTES.invitations}>
                <UserPlus className="h-4 w-4" />
                Invite staff
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {selectedIds.size > 0 && permissions.canUpdate ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <select
            aria-label="Bulk assign role"
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                handleBulkAssignRole(event.target.value);
                event.target.value = "";
              }
            }}
          >
            <option value="">Assign role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Bulk assign branch"
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                handleBulkBranch(event.target.value);
                event.target.value = "";
              }
            }}
          >
            <option value="">Assign branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <Button type="button" size="sm" variant="outline" onClick={() => handleBulkStatus(true)}>
            Activate
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => handleBulkStatus(false)}>
            Deactivate
          </Button>
        </div>
      ) : null}

      {directory.items.length === 0 ? (
        <StaffEmptyState
          title="No staff members found"
          description="Adjust your filters or invite your first team member."
          actionHref={permissions.canInvite ? STAFF_MANAGEMENT_ROUTES.invitations : undefined}
          actionLabel="Invite staff"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    aria-label="Select all staff"
                    onChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Staff member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directory.items.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(member.id)}
                      aria-label={`Select ${member.firstName} ${member.lastName}`}
                      onChange={() => toggleSelected(member.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
                        {getStaffInitials(member.firstName, member.lastName)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {member.email || member.employeeCode || "No contact"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{member.roles[0]?.name ?? "—"}</TableCell>
                  <TableCell>
                    {member.branchAssignments.find((entry) => entry.isPrimary)?.branchName ??
                      member.branch?.name ??
                      "—"}
                  </TableCell>
                  <TableCell>{member.department || "—"}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <p>{member.isActive ? "Active" : "Inactive"}</p>
                      <p className="text-muted-foreground">
                        {ACCOUNT_STATUS_OPTIONS.find(
                          (option) => option.value === member.accountStatus,
                        )?.label ?? member.accountStatus}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`${STAFF_MANAGEMENT_ROUTES.members}/${member.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          Showing {directory.items.length} of {directory.total} staff members
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending || directory.page <= 1}
            onClick={() => loadDirectory(directory.page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending || directory.page >= directory.totalPages}
            onClick={() => loadDirectory(directory.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
