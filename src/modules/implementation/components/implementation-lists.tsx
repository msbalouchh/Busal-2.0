import {
  IMPLEMENTATION_RISK_SEVERITY_LABELS,
  IMPLEMENTATION_STATUS_LABELS,
  IMPLEMENTATION_TASK_STATUS_LABELS,
} from "@/modules/implementation/constants/routes";
import type {
  ImplementationProjectView,
  ProjectTemplateView,
} from "@/modules/implementation/utils/implementation-utils";
import type {
  GoLiveChecklistItemData,
  ImplementationChangeRequestData,
  ImplementationHypercareData,
  ImplementationIssueData,
  ImplementationMilestoneData,
  ImplementationRiskData,
  ImplementationTaskData,
} from "@/services/implementation-delivery.service";

export function ImplementationProjectsList({
  projects,
}: {
  projects: ImplementationProjectView[];
}) {
  if (projects.length === 0) {
    return <p className="text-muted-foreground text-sm">No implementation projects yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {projects.map((project) => (
        <li key={project.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{project.name}</span>
            <span className="text-muted-foreground">
              {IMPLEMENTATION_STATUS_LABELS[
                project.status as keyof typeof IMPLEMENTATION_STATUS_LABELS
              ] ?? project.status}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {project.customerName} · {project.industry ?? "General"} · {project.milestoneCount}{" "}
            milestones · {project.taskCount} tasks
          </p>
          {project.portalToken ? (
            <p className="text-muted-foreground mt-1 text-xs">
              Customer portal: /implementation/{project.portalToken.slice(0, 8)}…
            </p>
          ) : null}
          {project.hypercareActive ? (
            <p className="mt-1 text-xs text-green-700">Hypercare active</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function ProjectTemplatesList({ templates }: { templates: ProjectTemplateView[] }) {
  if (templates.length === 0) {
    return <p className="text-muted-foreground text-sm">No project templates yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {templates.map((template) => (
        <li key={template.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{template.name}</span>
            <span className="text-muted-foreground">{template.industry}</span>
          </div>
          {template.description ? (
            <p className="text-muted-foreground mt-1 text-xs">{template.description}</p>
          ) : null}
          <p className="text-muted-foreground mt-1 text-xs">{template.milestoneCount} milestones</p>
        </li>
      ))}
    </ul>
  );
}

export function ImplementationMilestonesList({
  milestones,
}: {
  milestones: ImplementationMilestoneData[];
}) {
  if (milestones.length === 0) {
    return <p className="text-muted-foreground text-sm">No milestones yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {milestones.map((milestone) => (
        <li key={milestone.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{milestone.name}</span>
            <span className="text-muted-foreground">{milestone.status}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">{milestone.projectName}</p>
        </li>
      ))}
    </ul>
  );
}

export function ImplementationTasksList({ tasks }: { tasks: ImplementationTaskData[] }) {
  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-sm">No tasks yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {tasks.map((task) => (
        <li key={task.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{task.title}</span>
            <span className="text-muted-foreground">
              {IMPLEMENTATION_TASK_STATUS_LABELS[
                task.status as keyof typeof IMPLEMENTATION_TASK_STATUS_LABELS
              ] ?? task.status}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {task.projectName}
            {task.isMandatoryForGoLive ? " · Mandatory for go-live" : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ImplementationRisksList({ risks }: { risks: ImplementationRiskData[] }) {
  if (risks.length === 0) {
    return <p className="text-muted-foreground text-sm">No risks logged.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {risks.map((risk) => (
        <li key={risk.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{risk.title}</span>
            <span className="text-muted-foreground">
              {IMPLEMENTATION_RISK_SEVERITY_LABELS[
                risk.severity as keyof typeof IMPLEMENTATION_RISK_SEVERITY_LABELS
              ] ?? risk.severity}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {risk.projectName} · {risk.status}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ImplementationIssuesList({ issues }: { issues: ImplementationIssueData[] }) {
  if (issues.length === 0) {
    return <p className="text-muted-foreground text-sm">No issues logged.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {issues.map((issue) => (
        <li key={issue.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{issue.title}</span>
            <span className="text-muted-foreground">{issue.status}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {issue.projectName}
            {issue.reportedByCustomer ? " · Customer reported" : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ImplementationChangeRequestsList({
  changeRequests,
}: {
  changeRequests: ImplementationChangeRequestData[];
}) {
  if (changeRequests.length === 0) {
    return <p className="text-muted-foreground text-sm">No change requests yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {changeRequests.map((changeRequest) => (
        <li key={changeRequest.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{changeRequest.title}</span>
            <span className="text-muted-foreground">{changeRequest.status}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {changeRequest.projectName}
            {changeRequest.requestedByName ? ` · ${changeRequest.requestedByName}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function GoLiveChecklistList({ checklist }: { checklist: GoLiveChecklistItemData[] }) {
  if (checklist.length === 0) {
    return <p className="text-muted-foreground text-sm">No go-live checklist items yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {checklist.map((item) => (
        <li key={item.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{item.title}</span>
            <span className="text-muted-foreground">{item.status}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {item.projectName}
            {item.isMandatory ? " · Mandatory" : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ImplementationHypercareList({
  hypercare,
}: {
  hypercare: ImplementationHypercareData[];
}) {
  if (hypercare.length === 0) {
    return <p className="text-muted-foreground text-sm">No hypercare records yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {hypercare.map((record) => (
        <li key={record.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{record.projectName}</span>
            <span className="text-muted-foreground">{record.status}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {record.startedAt.toLocaleDateString()} — {record.endsAt.toLocaleDateString()}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function CustomerPortalView({
  project,
  milestones,
  tasks,
  issues,
}: {
  project: ImplementationProjectView;
  milestones: Array<{ id: string; name: string; status: string; dueAt: Date | null }>;
  tasks: Array<{ id: string; title: string; status: string; dueAt: Date | null }>;
  issues: Array<{ id: string; title: string; status: string }>;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {project.customerName} ·{" "}
          {IMPLEMENTATION_STATUS_LABELS[
            project.status as keyof typeof IMPLEMENTATION_STATUS_LABELS
          ] ?? project.status}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Milestones</h2>
        {milestones.length === 0 ? (
          <p className="text-muted-foreground text-sm">No milestones to display.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {milestones.map((milestone) => (
              <li key={milestone.id} className="rounded-md border p-3">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{milestone.name}</span>
                  <span className="text-muted-foreground">{milestone.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Your Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tasks to display.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {tasks.map((task) => (
              <li key={task.id} className="rounded-md border p-3">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{task.title}</span>
                  <span className="text-muted-foreground">{task.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {issues.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Reported Issues</h2>
          <ul className="space-y-2 text-sm">
            {issues.map((issue) => (
              <li key={issue.id} className="rounded-md border p-3">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{issue.title}</span>
                  <span className="text-muted-foreground">{issue.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {project.hypercareActive ? (
        <p className="text-sm text-green-700">Your account is in the hypercare support period.</p>
      ) : null}
    </div>
  );
}
