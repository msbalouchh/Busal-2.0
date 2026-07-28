import { ExecutiveReviewsList } from "@/modules/customer-success/components/customer-success-lists";
import { getExecutiveReviewsContext } from "@/modules/customer-success/lib/get-customer-success-context";

export default async function ExecutiveReviewsPage() {
  const { reviews } = await getExecutiveReviewsContext();

  return <ExecutiveReviewsList reviews={reviews} />;
}
