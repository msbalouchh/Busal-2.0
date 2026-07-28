import { IamLists } from "@/modules/iam/components/iam-lists";
import { getIamSessionsContext } from "@/modules/iam/lib/get-iam-context";

export default async function IamSessionsPage() {
  const { sessions } = await getIamSessionsContext();

  return <IamLists sessions={sessions} />;
}
