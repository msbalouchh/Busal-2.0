import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { Section } from "@/components/common/section";
import { Breadcrumb, PageHeader } from "@/components/navigation";
import type { BreadcrumbItem } from "@/components/navigation/types";

interface ApplicationPageTemplateProps {
  title: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  icon?: LucideIcon;
  children?: ReactNode;
}

export function ApplicationPageTemplate({
  title,
  description,
  breadcrumbs,
  icon,
  children,
}: ApplicationPageTemplateProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <Section>
        <PageHeader title={title} description={description} icon={icon} />
        <Breadcrumb items={breadcrumbs} />
      </Section>

      <Section>
        {children ?? (
          <EmptyState
            title="No content available"
            description="This section has no data to display yet. Check back after configuration or activity in this module."
          />
        )}
      </Section>
    </div>
  );
}
