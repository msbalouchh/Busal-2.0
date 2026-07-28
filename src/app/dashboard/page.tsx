import type { Metadata } from "next";

import { DashboardHome } from "@/modules/dashboard/components/dashboard-home";
import { getDashboardContext } from "@/modules/dashboard/lib/get-dashboard-context";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { user, business } = await getDashboardContext();

  return <DashboardHome business={business} userFullName={user.fullName} />;
}
