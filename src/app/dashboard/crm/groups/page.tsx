import { getCrmGroupsContext } from "@/modules/crm/lib/get-crm-context";

export default async function CrmGroupsPage() {
  const data = await getCrmGroupsContext();

  return (
    <section className="bg-card rounded-xl border p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Customer Groups</h3>
      <ul className="divide-y rounded-lg border">
        {data.groups.map((group) => (
          <li key={group.id} className="p-4 text-sm">
            <p className="font-medium">{group.name}</p>
            <p className="text-muted-foreground text-xs">
              {group.slug} · {group.isSystem ? "System" : "Custom"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
