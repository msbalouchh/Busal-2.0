import { ImplementationRisksList } from "@/modules/implementation/components/implementation-lists";
import { getImplementationRisksContext } from "@/modules/implementation/lib/get-implementation-context";

export default async function ImplementationRisksPage() {
  const { risks } = await getImplementationRisksContext();

  return <ImplementationRisksList risks={risks} />;
}
