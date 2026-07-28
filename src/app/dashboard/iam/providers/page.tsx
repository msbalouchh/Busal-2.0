import { IamLists } from "@/modules/iam/components/iam-lists";
import { getIamProvidersContext } from "@/modules/iam/lib/get-iam-context";

export default async function IamProvidersPage() {
  const { providers } = await getIamProvidersContext();

  return <IamLists providers={providers} />;
}
