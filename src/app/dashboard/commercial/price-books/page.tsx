import { PriceBooksList } from "@/modules/commercial/components/commercial-lists";
import { getCommercialPriceBooksContext } from "@/modules/commercial/lib/get-commercial-context";

export default async function CommercialPriceBooksPage() {
  const { priceBooks } = await getCommercialPriceBooksContext();

  return <PriceBooksList priceBooks={priceBooks} />;
}
