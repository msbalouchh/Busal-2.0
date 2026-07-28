import { ProfitabilityReport } from "@/modules/revops/components/revops-lists";
import { getRevopsProfitabilityContext } from "@/modules/revops/lib/get-revops-context";

export default async function RevopsProfitabilityPage() {
  const { profitability } = await getRevopsProfitabilityContext();

  return <ProfitabilityReport profitability={profitability} />;
}
