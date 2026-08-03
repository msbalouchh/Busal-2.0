import type { CustomerRecord } from "@/modules/crm/types/customer";

export function formatCustomerName(record: CustomerRecord): string {
  return record.profile.displayName;
}

export function formatSpent(pence: number, currency = "GBP"): string {
  const amount = pence / 100;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
}

export function getCustomerSummary(record: CustomerRecord): string {
  return [
    record.profile.displayName,
    record.profile.email ?? "No email",
    `${record.analytics.visitCount} visits`,
    formatSpent(record.analytics.totalSpentPence),
    `${record.loyalty.pointsBalance} pts`,
  ].join(" · ");
}

export function sortByLifetimeValue(records: CustomerRecord[]): CustomerRecord[] {
  return [...records].sort(
    (left, right) => right.analytics.lifetimeValuePence - left.analytics.lifetimeValuePence,
  );
}

export function filterBySegment(records: CustomerRecord[], segmentId: string): CustomerRecord[] {
  return records.filter((record) => record.customer.segmentIds.includes(segmentId));
}
