"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BranchStatusBadge } from "@/modules/branch-management/components/branch-status-badge";
import { BRANCH_MANAGEMENT_ROUTES } from "@/modules/branch-management/constants/routes";
import type { BranchManagementPermissions } from "@/modules/branch-management/lib/get-branch-management-context";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";
import { BRANCH_TYPE_OPTIONS } from "@/modules/branch-management/types/branch-management-types";

interface BranchTableProps {
  branches: BranchManagementRecord[];
  permissions: BranchManagementPermissions;
}

export function BranchTable({ branches, permissions }: BranchTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table aria-label="Branches table">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Name</TableHead>
            <TableHead scope="col">Code</TableHead>
            <TableHead scope="col">Type</TableHead>
            <TableHead scope="col">Location</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col" className="text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => {
            const typeLabel =
              BRANCH_TYPE_OPTIONS.find((option) => option.value === branch.type)?.label ??
              branch.type;

            return (
              <TableRow key={branch.id}>
                <TableCell className="font-medium">{branch.name}</TableCell>
                <TableCell className="font-mono text-xs">{branch.code}</TableCell>
                <TableCell>{typeLabel}</TableCell>
                <TableCell>
                  {[branch.city, branch.country].filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell>
                  <BranchStatusBadge status={branch.status} isPrimary={branch.isPrimary} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={BRANCH_MANAGEMENT_ROUTES.details(branch.id)}>View</Link>
                    </Button>
                    {permissions.canUpdate ? (
                      <Button asChild size="sm" variant="ghost">
                        <Link href={BRANCH_MANAGEMENT_ROUTES.edit(branch.id)}>Edit</Link>
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
