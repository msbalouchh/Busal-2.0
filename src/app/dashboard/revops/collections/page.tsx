import { CollectionsList } from "@/modules/revops/components/revops-lists";
import { getRevopsCollectionsContext } from "@/modules/revops/lib/get-revops-context";

export default async function RevopsCollectionsPage() {
  const { collections } = await getRevopsCollectionsContext();

  return <CollectionsList collections={collections} />;
}
