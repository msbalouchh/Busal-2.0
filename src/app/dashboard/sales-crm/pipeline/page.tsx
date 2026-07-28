import { SalesPipelineBoard } from "@/modules/sales-crm/components/sales-crm-lists";
import { getSalesPipelineContext } from "@/modules/sales-crm/lib/get-sales-crm-context";

export default async function SalesPipelinePage() {
  const { pipelines, opportunities } = await getSalesPipelineContext();
  const pipeline = pipelines[0];

  if (!pipeline) {
    return <p className="text-muted-foreground text-sm">No pipeline configured.</p>;
  }

  return <SalesPipelineBoard pipeline={pipeline} opportunities={opportunities} />;
}
