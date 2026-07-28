import { RevenueForecastList } from "@/modules/revops/components/revops-lists";
import { getRevopsForecastingContext } from "@/modules/revops/lib/get-revops-context";

export default async function RevopsForecastingPage() {
  const { forecast } = await getRevopsForecastingContext();

  return <RevenueForecastList forecast={forecast} />;
}
