import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MenuStatusBadge } from "@/modules/menu-management/components/menu-status-badge";
import {
  MENU_MANAGEMENT_ROUTES,
  MENU_TYPE_FILTER_OPTIONS,
} from "@/modules/menu-management/constants/routes";
import type { MenuManagementRecord } from "@/modules/menu-management/types/menu-management-types";

interface MenuTableProps {
  items: MenuManagementRecord[];
}

function getMenuTypeLabel(menuType: MenuManagementRecord["menuType"]): string {
  return MENU_TYPE_FILTER_OPTIONS.find((option) => option.value === menuType)?.label ?? menuType;
}

export function MenuTable({ items }: MenuTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/40 border-b">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Branch</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Order</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((menu) => (
            <tr key={menu.id} className="border-b last:border-b-0">
              <td className="px-4 py-3">
                <div className="font-medium">{menu.name}</div>
                {menu.description ? (
                  <div className="text-muted-foreground line-clamp-1">{menu.description}</div>
                ) : null}
              </td>
              <td className="px-4 py-3">{getMenuTypeLabel(menu.menuType)}</td>
              <td className="px-4 py-3">{menu.branchName ?? "All branches"}</td>
              <td className="px-4 py-3">
                <MenuStatusBadge status={menu.status} isDefault={menu.isDefault} />
              </td>
              <td className="px-4 py-3">{menu.displayOrder}</td>
              <td className="px-4 py-3 text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={MENU_MANAGEMENT_ROUTES.details(menu.id)}>View</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
