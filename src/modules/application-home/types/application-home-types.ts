import type { DashboardHomeData } from "@/modules/dashboard/types/dashboard";

export interface ApplicationHomeChartPoint {
  day: string;
  amount?: number;
  count?: number;
  [key: string]: string | number | undefined;
}

export interface ApplicationHomeQuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
}

export interface ApplicationHomeScheduleItem {
  id: string;
  title: string;
  time: string;
  href?: string;
}

export interface ApplicationHomeTopProduct {
  name: string;
  quantitySold: number;
  revenuePence: number;
}

export interface ApplicationHomeHero {
  greeting: string;
  ownerName: string;
  businessName: string;
  todayLabel: string;
  summary: string;
}

export interface ApplicationHomeData {
  hero: ApplicationHomeHero;
  homeData: DashboardHomeData;
  revenueTrend: ApplicationHomeChartPoint[];
  ordersTrend: ApplicationHomeChartPoint[];
  customerGrowth: ApplicationHomeChartPoint[];
  topProducts: ApplicationHomeTopProduct[];
  businessHealthScore: number;
  quickActions: ApplicationHomeQuickAction[];
  aiInsights: string[];
  aiSummary: string;
  todaySchedule: ApplicationHomeScheduleItem[];
  favoriteShortcuts: ApplicationHomeQuickAction[];
}
