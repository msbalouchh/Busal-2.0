import { ImplementationMilestonesList } from "@/modules/implementation/components/implementation-lists";
import { getImplementationMilestonesContext } from "@/modules/implementation/lib/get-implementation-context";

export default async function ImplementationMilestonesPage() {
  const { milestones } = await getImplementationMilestonesContext();

  return <ImplementationMilestonesList milestones={milestones} />;
}
