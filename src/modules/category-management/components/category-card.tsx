import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryStatusBadge } from "@/modules/category-management/components/category-status-badge";
import { CATEGORY_MANAGEMENT_ROUTES } from "@/modules/category-management/constants/routes";
import type { CategoryManagementRecord } from "@/modules/category-management/types/category-management-types";

interface CategoryCardProps {
  menuId: string;
  category: CategoryManagementRecord;
}

export function CategoryCard({ menuId, category }: CategoryCardProps) {
  return (
    <Link
      href={CATEGORY_MANAGEMENT_ROUTES.details(menuId, category.id)}
      className="group block h-full"
    >
      <Card className="flex h-full flex-col rounded-xl shadow-sm transition-shadow group-hover:shadow-md">
        {category.image ? (
          <div
            className="bg-muted h-32 bg-cover bg-center"
            style={{ backgroundImage: `url(${category.image})` }}
            role="img"
            aria-label={`${category.name} image`}
          />
        ) : (
          <div className="bg-muted flex h-32 items-center justify-center text-3xl">
            {category.icon || "📁"}
          </div>
        )}
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{category.name}</CardTitle>
              <CardDescription>{category.slug}</CardDescription>
            </div>
            <CategoryStatusBadge status={category.status} isFeatured={category.isFeatured} />
          </div>
        </CardHeader>
        <CardContent className="mt-auto space-y-2 text-sm">
          {category.description ? (
            <p className="text-muted-foreground line-clamp-2">{category.description}</p>
          ) : null}
          <p className="text-muted-foreground">
            {category.childCount} subcategories · Order {category.displayOrder}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
