import { SuccessPlaybooksList } from "@/modules/customer-success/components/customer-success-lists";
import { getSuccessPlaybooksContext } from "@/modules/customer-success/lib/get-customer-success-context";

export default async function SuccessPlaybooksPage() {
  const { playbooks } = await getSuccessPlaybooksContext();

  return <SuccessPlaybooksList playbooks={playbooks} />;
}
