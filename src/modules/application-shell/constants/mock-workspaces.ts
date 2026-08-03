import type { WorkspaceSummary } from "@/modules/application-shell/types/workspace-shell.types";

export const MOCK_WORKSPACES: WorkspaceSummary[] = [
  {
    id: "ws-harbour-kitchen",
    name: "Harbour Kitchen",
    slug: "harbour-kitchen",
    role: "Owner",
    isActive: true,
  },
  {
    id: "ws-northside-retail",
    name: "Northside Retail",
    slug: "northside-retail",
    role: "Owner",
    isActive: false,
  },
  {
    id: "ws-atlas-clinic",
    name: "Atlas Wellness Clinic",
    slug: "atlas-clinic",
    role: "Administrator",
    isActive: false,
  },
];
