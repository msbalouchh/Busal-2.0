import { RevenueRecognitionList } from "@/modules/revops/components/revops-lists";
import { getRevopsRecognitionContext } from "@/modules/revops/lib/get-revops-context";

export default async function RevopsRecognitionPage() {
  const { recognition } = await getRevopsRecognitionContext();

  return <RevenueRecognitionList recognition={recognition} />;
}
