import { getCrmLoyaltyContext } from "@/modules/crm/lib/get-crm-context";

export default async function CrmLoyaltyPage() {
  const data = await getCrmLoyaltyContext();

  return (
    <section className="bg-card rounded-xl border p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Loyalty Program</h3>
      <ul className="space-y-2 text-sm">
        <li>Enabled: {data.program.isEnabled ? "Yes" : "No"}</li>
        <li>Earn points per pound: {data.program.earnPointsPerPound}</li>
        <li>Redeem points per pence: {data.program.redeemPointsPerPence}</li>
        <li>
          Points expiry days: {data.program.pointsExpiryDays ?? "Not configured (future-ready)"}
        </li>
      </ul>
    </section>
  );
}
