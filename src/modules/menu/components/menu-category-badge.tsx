import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MenuCategoryType } from "@/modules/menu/constants/menu-status";

interface MenuCategoryBadgeProps {
  categoryType: MenuCategoryType;
  className?: string;
}

const CATEGORY_LABEL: Record<MenuCategoryType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  drinks: "Drinks",
  desserts: "Desserts",
  special_offers: "Special Offers",
  seasonal: "Seasonal",
};

export function MenuCategoryBadge({ categoryType, className }: MenuCategoryBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal capitalize", className)}>
      {CATEGORY_LABEL[categoryType]}
    </Badge>
  );
}
