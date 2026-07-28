import {
  CUSTOMER_FEEDBACK_TYPE_LABELS,
  CUSTOMER_HEALTH_STATUS_LABELS,
} from "@/modules/customer-success/constants/routes";
import type {
  Customer360ProfileView,
  SuccessPlaybookView,
} from "@/modules/customer-success/utils/customer-success-utils";
import type {
  CustomerExpansionData,
  CustomerFeedbackData,
  CustomerRenewalData,
  CustomerSuccessTaskData,
  ExecutiveReviewData,
} from "@/services/customer-success.service";

function formatGbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export function Customer360ProfilesList({ profiles }: { profiles: Customer360ProfileView[] }) {
  if (profiles.length === 0) {
    return <p className="text-muted-foreground text-sm">No customer profiles yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {profiles.map((profile) => (
        <li key={profile.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{profile.customerName}</span>
            <span className="text-muted-foreground">
              {CUSTOMER_HEALTH_STATUS_LABELS[
                profile.healthStatus as keyof typeof CUSTOMER_HEALTH_STATUS_LABELS
              ] ?? profile.healthStatus}{" "}
              · {profile.healthScore}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {profile.contractNumber ?? profile.contractId} · {profile.industry ?? "General"} ·{" "}
            {profile.implementationStatus ?? "No implementation"}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {profile.openTaskCount} open tasks · {profile.openFeedbackCount} feedback items ·{" "}
            {profile.expansionCount} expansion opportunities
          </p>
        </li>
      ))}
    </ul>
  );
}

export function CustomerHealthScoresList({ profiles }: { profiles: Customer360ProfileView[] }) {
  if (profiles.length === 0) {
    return <p className="text-muted-foreground text-sm">No health scores yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {profiles.map((profile) => (
        <li key={profile.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{profile.customerName}</span>
            <span className="font-semibold">{profile.healthScore}/100</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {CUSTOMER_HEALTH_STATUS_LABELS[
              profile.healthStatus as keyof typeof CUSTOMER_HEALTH_STATUS_LABELS
            ] ?? profile.healthStatus}
            {profile.lastHealthCalculatedAt
              ? ` · Updated ${profile.lastHealthCalculatedAt.toLocaleDateString()}`
              : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function CustomerSuccessTasksList({ tasks }: { tasks: CustomerSuccessTaskData[] }) {
  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-sm">No success tasks yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {tasks.map((task) => (
        <li key={task.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{task.title}</span>
            <span className="text-muted-foreground">{task.status}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {task.customerName} · {task.taskType} · {task.priority}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function SuccessPlaybooksList({ playbooks }: { playbooks: SuccessPlaybookView[] }) {
  if (playbooks.length === 0) {
    return <p className="text-muted-foreground text-sm">No playbooks yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {playbooks.map((playbook) => (
        <li key={playbook.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{playbook.name}</span>
            <span className="text-muted-foreground">{playbook.trigger}</span>
          </div>
          {playbook.description ? (
            <p className="text-muted-foreground mt-1 text-xs">{playbook.description}</p>
          ) : null}
          <p className="text-muted-foreground mt-1 text-xs">
            {playbook.industry ?? "All industries"} · {playbook.stepCount} steps
          </p>
        </li>
      ))}
    </ul>
  );
}

export function CustomerFeedbackList({ feedback }: { feedback: CustomerFeedbackData[] }) {
  if (feedback.length === 0) {
    return <p className="text-muted-foreground text-sm">No feedback recorded yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {feedback.map((item) => (
        <li key={item.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{item.title}</span>
            <span className="text-muted-foreground">
              {CUSTOMER_FEEDBACK_TYPE_LABELS[
                item.feedbackType as keyof typeof CUSTOMER_FEEDBACK_TYPE_LABELS
              ] ?? item.feedbackType}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {item.customerName}
            {item.score != null ? ` · Score ${item.score}` : ""} · {item.status}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function CustomerRenewalsList({ renewals }: { renewals: CustomerRenewalData[] }) {
  if (renewals.length === 0) {
    return <p className="text-muted-foreground text-sm">No renewals scheduled yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {renewals.map((renewal) => (
        <li key={renewal.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{renewal.customerName}</span>
            <span className="text-muted-foreground">{renewal.status}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Renewal {renewal.renewalDate.toLocaleDateString()}
            {renewal.taskGenerated ? " · Task generated" : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ExpansionOpportunitiesList({
  expansions,
}: {
  expansions: CustomerExpansionData[];
}) {
  if (expansions.length === 0) {
    return <p className="text-muted-foreground text-sm">No expansion opportunities yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {expansions.map((expansion) => (
        <li key={expansion.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{expansion.title}</span>
            <span className="text-muted-foreground">
              {formatGbp(expansion.estimatedValuePence)}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {expansion.customerName} · {expansion.expansionType} · {expansion.status}
            {expansion.salesOpportunityId ? " · Linked to Sales CRM" : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ExecutiveReviewsList({ reviews }: { reviews: ExecutiveReviewData[] }) {
  if (reviews.length === 0) {
    return <p className="text-muted-foreground text-sm">No executive reviews yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{review.customerName}</span>
            <span className="text-muted-foreground">{review.status}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Scheduled {review.scheduledAt.toLocaleDateString()}
            {review.completedAt ? ` · Completed ${review.completedAt.toLocaleDateString()}` : ""}
          </p>
          {review.summary ? (
            <p className="text-muted-foreground mt-1 text-xs">{review.summary}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
