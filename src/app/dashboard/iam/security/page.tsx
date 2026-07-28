import { IamLists } from "@/modules/iam/components/iam-lists";
import { getIamSecurityContext } from "@/modules/iam/lib/get-iam-context";

export default async function IamSecurityPage() {
  const { auditLogs } = await getIamSecurityContext();

  return <IamLists auditLogs={auditLogs} />;
}
