import { IamLists } from "@/modules/iam/components/iam-lists";
import { getIamApiKeysContext } from "@/modules/iam/lib/get-iam-context";

export default async function IamApiKeysPage() {
  const { apiKeys } = await getIamApiKeysContext();

  return <IamLists apiKeys={apiKeys} />;
}
