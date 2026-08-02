import type { StaffAuditEntry } from "@/modules/staff/types/staff-management-types";

interface StaffActivityTimelineProps {
  entries: StaffAuditEntry[];
  title?: string;
}

export function StaffActivityTimeline({
  entries,
  title = "Audit timeline",
}: StaffActivityTimelineProps) {
  return (
    <section className="space-y-4 rounded-lg border p-4" aria-labelledby="staff-activity-heading">
      <h3 id="staff-activity-heading" className="text-lg font-semibold">
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
      ) : (
        <ol className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="border-l-2 pl-4">
              <p className="text-sm font-medium">{entry.eventType.replaceAll("_", " ")}</p>
              <p className="text-muted-foreground text-xs">
                {new Date(entry.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
