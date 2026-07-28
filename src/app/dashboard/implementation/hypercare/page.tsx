import { ImplementationHypercareList } from "@/modules/implementation/components/implementation-lists";
import { getImplementationHypercareContext } from "@/modules/implementation/lib/get-implementation-context";

export default async function ImplementationHypercarePage() {
  const { hypercare } = await getImplementationHypercareContext();

  return <ImplementationHypercareList hypercare={hypercare} />;
}
