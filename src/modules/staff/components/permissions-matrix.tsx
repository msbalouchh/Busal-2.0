"use client";

import { Loader2 } from "lucide-react";
import { Fragment, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saveStaffPermissionsAction } from "@/modules/staff/actions/staff-management-actions";
import {
  listPermissionGroups,
  resolvePermissionGroup,
} from "@/modules/staff/registry/permission-groups";
import type { RolePermissionMatrix } from "@/services/staff-management.service";

interface PermissionsMatrixProps {
  matrix: RolePermissionMatrix;
}

export function PermissionsMatrix({ matrix }: PermissionsMatrixProps) {
  const [isPending, startTransition] = useTransition();
  const { permissions, roles } = matrix;
  const [assignments, setAssignments] = useState<Record<string, Set<string>>>(() => {
    const initial: Record<string, Set<string>> = {};

    for (const [roleId, permissionIds] of Object.entries(matrix.assignments)) {
      initial[roleId] = new Set(permissionIds);
    }

    return initial;
  });

  const permissionsByGroup = useMemo(() => {
    const grouped = new Map<string, (typeof permissions)[number][]>();

    for (const permission of permissions) {
      const group = resolvePermissionGroup(permission.module);
      const list = grouped.get(group.label) ?? [];
      list.push(permission);
      grouped.set(group.label, list);
    }

    const order = listPermissionGroups().map((entry) => entry.label);
    return Array.from(grouped.entries()).sort(
      ([a], [b]) =>
        (order.indexOf(a) === -1 ? 999 : order.indexOf(a)) -
        (order.indexOf(b) === -1 ? 999 : order.indexOf(b)),
    );
  }, [permissions]);

  const togglePermission = (roleId: string, permissionId: string) => {
    setAssignments((current) => {
      const next = { ...current };
      const roleSet = new Set(next[roleId] ?? []);

      if (roleSet.has(permissionId)) {
        roleSet.delete(permissionId);
      } else {
        roleSet.add(permissionId);
      }

      next[roleId] = roleSet;
      return next;
    });
  };

  const handleSave = () => {
    const payload = roles.map((role) => ({
      roleId: role.id,
      permissionIds: Array.from(assignments[role.id] ?? []),
    }));

    startTransition(async () => {
      try {
        await saveStaffPermissionsAction(payload);
        toast.success("Permissions saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save permissions");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save permissions
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Permission</TableHead>
              {roles.map((role) => (
                <TableHead key={role.id} className="min-w-[100px] text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>{role.name}</span>
                    {role.isSystem ? (
                      <span className="text-muted-foreground text-xs font-normal">System</span>
                    ) : null}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissionsByGroup.map(([groupName, groupPermissions]) => (
              <Fragment key={groupName}>
                <TableRow>
                  <TableCell colSpan={roles.length + 1} className="bg-muted/50 font-semibold">
                    {groupName}
                  </TableCell>
                </TableRow>
                {groupPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{permission.name}</p>
                        {permission.description ? (
                          <p className="text-muted-foreground text-xs">{permission.description}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    {roles.map((role) => {
                      const isChecked = assignments[role.id]?.has(permission.id) ?? false;

                      return (
                        <TableCell key={`${role.id}-${permission.id}`} className="text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(role.id, permission.id)}
                            disabled={isPending}
                            aria-label={`${permission.name} for ${role.name}`}
                            className="h-4 w-4"
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
