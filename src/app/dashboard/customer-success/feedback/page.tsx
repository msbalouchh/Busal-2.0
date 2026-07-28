import { CustomerFeedbackList } from "@/modules/customer-success/components/customer-success-lists";
import { getCustomerFeedbackContext } from "@/modules/customer-success/lib/get-customer-success-context";

export default async function CustomerFeedbackPage() {
  const { feedback } = await getCustomerFeedbackContext();

  return <CustomerFeedbackList feedback={feedback} />;
}
