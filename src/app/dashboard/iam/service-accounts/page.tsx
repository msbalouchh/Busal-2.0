import { IamLists } from "@/modules/iam/components/iam-lists";
import { getIamServiceAccountsContext } from "@/modules/iam/lib/get-iam-context";

export default async function IamServiceAccountsPage() {
  const { serviceAccounts } = await getIamServiceAccountsContext();

  return <IamLists serviceAccounts={serviceAccounts} />;
}
