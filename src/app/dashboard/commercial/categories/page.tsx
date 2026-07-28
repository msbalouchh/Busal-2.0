import { CommercialCategoriesList } from "@/modules/commercial/components/commercial-lists";
import { getCommercialCategoriesContext } from "@/modules/commercial/lib/get-commercial-context";

export default async function CommercialCategoriesPage() {
  const { categories } = await getCommercialCategoriesContext();

  return <CommercialCategoriesList categories={categories} />;
}
