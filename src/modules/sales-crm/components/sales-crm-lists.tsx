import {
  CATALOGUE_LINK_TYPE_LABELS,
  DEMO_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  TASK_STATUS_LABELS,
} from "@/modules/sales-crm/constants/routes";
import type {
  SalesActivityView,
  SalesCompanyView,
  SalesContactView,
  SalesDemoView,
  SalesLeadView,
  SalesOpportunityView,
  SalesPipelineView,
  SalesTaskView,
} from "@/modules/sales-crm/utils/sales-utils";
import { formatSalesMoney } from "@/modules/sales-crm/utils/sales-utils";

export function SalesPipelineBoard({
  pipeline,
  opportunities,
}: {
  pipeline: SalesPipelineView;
  opportunities: SalesOpportunityView[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {pipeline.stages
        .filter((stage) => stage.isActive)
        .map((stage) => {
          const stageOpportunities = opportunities.filter(
            (opportunity) => opportunity.stageId === stage.id,
          );

          return (
            <div key={stage.id} className="bg-card rounded-xl border p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">{stage.name}</h3>
                <span className="text-muted-foreground text-xs">{stage.opportunityCount}</span>
              </div>
              <ul className="space-y-2 text-sm">
                {stageOpportunities.length === 0 ? (
                  <li className="text-muted-foreground text-xs">No opportunities</li>
                ) : (
                  stageOpportunities.map((opportunity) => (
                    <li key={opportunity.id} className="rounded-md border p-3">
                      <p className="font-medium">{opportunity.name}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatSalesMoney(opportunity.valuePence)}
                        {opportunity.companyName ? ` · ${opportunity.companyName}` : ""}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
    </div>
  );
}

export function SalesLeadsList({ leads }: { leads: SalesLeadView[] }) {
  if (leads.length === 0) {
    return <p className="text-muted-foreground text-sm">No leads yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {leads.map((lead) => (
        <li key={lead.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{lead.title}</span>
            <span className="text-muted-foreground">{LEAD_STATUS_LABELS[lead.status]}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {LEAD_SOURCE_LABELS[lead.source]} · {formatSalesMoney(lead.estimatedValuePence)}
            {lead.companyName ? ` · ${lead.companyName}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function SalesCompaniesList({ companies }: { companies: SalesCompanyView[] }) {
  if (companies.length === 0) {
    return <p className="text-muted-foreground text-sm">No companies yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {companies.map((company) => (
        <li key={company.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{company.name}</span>
            <span className="text-muted-foreground">{company.industry ?? "—"}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {company.contactCount} contacts · {company.opportunityCount} opportunities
          </p>
        </li>
      ))}
    </ul>
  );
}

export function SalesContactsList({ contacts }: { contacts: SalesContactView[] }) {
  if (contacts.length === 0) {
    return <p className="text-muted-foreground text-sm">No contacts yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {contacts.map((contact) => (
        <li key={contact.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">
              {contact.firstName} {contact.lastName}
            </span>
            <span className="text-muted-foreground">{contact.jobTitle ?? "—"}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {contact.email ?? "No email"}
            {contact.companyName ? ` · ${contact.companyName}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function SalesOpportunitiesList({
  opportunities,
}: {
  opportunities: SalesOpportunityView[];
}) {
  if (opportunities.length === 0) {
    return <p className="text-muted-foreground text-sm">No opportunities yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {opportunities.map((opportunity) => (
        <li key={opportunity.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{opportunity.name}</span>
            <span>{formatSalesMoney(opportunity.valuePence)}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {opportunity.stageName}
            {opportunity.companyName ? ` · ${opportunity.companyName}` : ""}
          </p>
          {opportunity.catalogueLinks.length > 0 ? (
            <p className="text-muted-foreground mt-2 text-xs">
              {opportunity.catalogueLinks.length} catalogue link
              {opportunity.catalogueLinks.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function SalesActivitiesList({ activities }: { activities: SalesActivityView[] }) {
  if (activities.length === 0) {
    return <p className="text-muted-foreground text-sm">No activities yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {activities.map((activity) => (
        <li key={activity.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{activity.title}</span>
            <span className="text-muted-foreground">{activity.activityType}</span>
          </div>
          {activity.description ? (
            <p className="text-muted-foreground mt-1 text-xs">{activity.description}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function SalesTasksList({ tasks }: { tasks: SalesTaskView[] }) {
  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-sm">No tasks yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {tasks.map((task) => (
        <li key={task.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{task.title}</span>
            <span className="text-muted-foreground">{TASK_STATUS_LABELS[task.status]}</span>
          </div>
          {task.dueAt ? (
            <p className="text-muted-foreground mt-1 text-xs">
              Due {task.dueAt.toLocaleDateString()}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function SalesDemosList({ demos }: { demos: SalesDemoView[] }) {
  if (demos.length === 0) {
    return <p className="text-muted-foreground text-sm">No demos scheduled.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {demos.map((demo) => (
        <li key={demo.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{demo.scheduledAt.toLocaleString()}</span>
            <span className="text-muted-foreground">{DEMO_STATUS_LABELS[demo.status]}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">{demo.durationMinutes} minutes</p>
        </li>
      ))}
    </ul>
  );
}

export function OpportunityCatalogueLinks({
  links,
}: {
  links: SalesOpportunityView["catalogueLinks"];
}) {
  if (links.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-1 text-xs">
      {links.map((link) => (
        <li key={link.id}>
          {CATALOGUE_LINK_TYPE_LABELS[link.linkType]}:{" "}
          {link.productName ?? link.bundleName ?? "Linked item"}
        </li>
      ))}
    </ul>
  );
}
