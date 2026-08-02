import type { Metadata } from "next";

import { ApplicationHomeDashboard } from "@/modules/application-home/components/application-home-dashboard";
import { getApplicationHomeData } from "@/modules/application-home/lib/get-application-home-data";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function ApplicationDashboardPage() {
  const data = await getApplicationHomeData();

  return <ApplicationHomeDashboard data={data} />;
}
