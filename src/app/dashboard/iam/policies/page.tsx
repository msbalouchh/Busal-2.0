import { IamLists } from "@/modules/iam/components/iam-lists";
import { getIamPoliciesContext } from "@/modules/iam/lib/get-iam-context";

export default async function IamPoliciesPage() {
  const { policies } = await getIamPoliciesContext();

  return <IamLists policies={policies} />;
}
