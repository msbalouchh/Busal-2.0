import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ModifierStatusBadge } from "@/modules/modifier-management/components/modifier-status-badge";
import { MODIFIER_MANAGEMENT_ROUTES } from "@/modules/modifier-management/constants/routes";
import type { ModifierManagementRecord } from "@/modules/modifier-management/types/modifier-management-types";

interface ModifierTableProps {
  menuId: string;
  modifierGroups: ModifierManagementRecord[];
}

export function ModifierTable({ menuId, modifierGroups }: ModifierTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Selection</TableHead>
            <TableHead>Options</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modifierGroups.map((group) => (
            <TableRow key={group.id}>
              <TableCell>
                <Link
                  href={MODIFIER_MANAGEMENT_ROUTES.details(menuId, group.id)}
                  className="font-medium hover:underline"
                >
                  {group.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground capitalize">
                {group.selectionType.toLowerCase()}
              </TableCell>
              <TableCell>{group.optionCount}</TableCell>
              <TableCell>{group.assignedProductCount}</TableCell>
              <TableCell>
                <ModifierStatusBadge status={group.status} isRequired={group.isRequired} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
