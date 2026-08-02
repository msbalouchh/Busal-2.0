import type { Metadata } from "next";

import { DashboardHome } from "@/modules/dashboard/components/dashboard-home";
import { getDashboardHomeData } from "@/modules/dashboard/lib/get-dashboard-home-data";
import { getDashboardShellContext } from "@/modules/dashboard/lib/get-dashboard-shell-context";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { context } = await getDashboardShellContext();
  const homeData = await getDashboardHomeData(context);

  return (
    <DashboardHome
      business={context.business}
      userFullName={context.user.fullName}
      homeData={homeData}
    />
  );
}
