import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  Car,
  Dumbbell,
  GraduationCap,
  Hotel,
  Pill,
  Scissors,
  ShoppingBag,
  Stethoscope,
  UtensilsCrossed,
} from "lucide-react";

import type { IndustryModuleIconKey } from "@/modules/business-modules/types/business-module-types";

export const INDUSTRY_MODULE_ICON_MAP: Record<IndustryModuleIconKey, LucideIcon> = {
  "utensils-crossed": UtensilsCrossed,
  scissors: Scissors,
  stethoscope: Stethoscope,
  "shopping-bag": ShoppingBag,
  hotel: Hotel,
  dumbbell: Dumbbell,
  pill: Pill,
  "graduation-cap": GraduationCap,
  "building-2": Building2,
  briefcase: Briefcase,
  car: Car,
};

export function resolveIndustryModuleIcon(iconKey: IndustryModuleIconKey): LucideIcon {
  return INDUSTRY_MODULE_ICON_MAP[iconKey];
}
