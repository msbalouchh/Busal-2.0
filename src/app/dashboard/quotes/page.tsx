import { QuotesDashboard } from "@/modules/quotes/components/quotes-dashboard";
import { getQuotesOverviewContext } from "@/modules/quotes/lib/get-quotes-context";

export default async function QuotesOverviewPage() {
  const { dashboard } = await getQuotesOverviewContext();

  return <QuotesDashboard dashboard={dashboard} />;
}
