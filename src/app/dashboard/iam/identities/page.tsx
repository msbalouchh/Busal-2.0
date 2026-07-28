import { IamLists } from "@/modules/iam/components/iam-lists";
import { getIamIdentitiesContext } from "@/modules/iam/lib/get-iam-context";

export default async function IamIdentitiesPage() {
  const { identities } = await getIamIdentitiesContext();

  return <IamLists identities={identities} />;
}
