import { QuotesList } from "@/modules/quotes/components/quotes-lists";
import { getQuotesListContext } from "@/modules/quotes/lib/get-quotes-context";

export default async function QuotesListPage() {
  const { quotes } = await getQuotesListContext();

  return <QuotesList quotes={quotes} />;
}
