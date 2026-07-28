import { CommercialProductsList } from "@/modules/commercial/components/commercial-lists";
import { getCommercialProductsContext } from "@/modules/commercial/lib/get-commercial-context";

export default async function CommercialProductsPage() {
  const { products } = await getCommercialProductsContext();

  return <CommercialProductsList products={products} />;
}
