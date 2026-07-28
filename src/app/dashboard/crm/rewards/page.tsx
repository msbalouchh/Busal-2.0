import { getCrmRewardsContext } from "@/modules/crm/lib/get-crm-context";
import { formatCrmMoney } from "@/modules/crm/utils/crm-utils";

export default async function CrmRewardsPage() {
  const data = await getCrmRewardsContext();

  return (
    <section className="bg-card rounded-xl border p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Rewards</h3>
      {data.rewards.length === 0 ? (
        <p className="text-muted-foreground text-sm">No rewards configured yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {data.rewards.map((reward) => (
            <li key={reward.id} className="p-4 text-sm">
              <p className="font-medium">{reward.name}</p>
              <p className="text-muted-foreground text-xs">
                {reward.type} · {reward.pointsCost} pts
                {reward.valuePence != null ? ` · ${formatCrmMoney(reward.valuePence)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
