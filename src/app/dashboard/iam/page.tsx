import { IamDashboard } from "@/modules/iam/components/iam-dashboard";
import { getIamOverviewContext } from "@/modules/iam/lib/get-iam-context";

export default async function IamOverviewPage() {
  const { dashboard } = await getIamOverviewContext();

  return <IamDashboard dashboard={dashboard} />;
}
