import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CategoryStatusBadge } from "@/modules/category-management/components/category-status-badge";
import { CATEGORY_MANAGEMENT_ROUTES } from "@/modules/category-management/constants/routes";
import type { CategoryManagementRecord } from "@/modules/category-management/types/category-management-types";

interface CategoryTableProps {
  menuId: string;
  items: CategoryManagementRecord[];
}

export function CategoryTable({ menuId, items }: CategoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-muted/40 border-b">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Slug</th>
            <th className="px-4 py-3 text-left font-medium">Parent</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Order</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((category) => (
            <tr key={category.id} className="border-b last:border-b-0">
              <td className="px-4 py-3 font-medium">{category.name}</td>
              <td className="px-4 py-3">{category.slug}</td>
              <td className="px-4 py-3">{category.parentCategoryName ?? "Root"}</td>
              <td className="px-4 py-3">
                <CategoryStatusBadge status={category.status} isFeatured={category.isFeatured} />
              </td>
              <td className="px-4 py-3">{category.displayOrder}</td>
              <td className="px-4 py-3 text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={CATEGORY_MANAGEMENT_ROUTES.details(menuId, category.id)}>View</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
