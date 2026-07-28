import { CommunicationDashboard } from "@/modules/communication/components/communication-dashboard";
import { getCommunicationOverviewContext } from "@/modules/communication/lib/get-communication-context";

export default async function CommunicationOverviewPage() {
  const { dashboard } = await getCommunicationOverviewContext();
  return <CommunicationDashboard dashboard={dashboard} />;
}
