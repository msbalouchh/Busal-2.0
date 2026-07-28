import { CustomerPortalView } from "@/modules/implementation/components/implementation-lists";
import { serializeImplementationProject } from "@/modules/implementation/utils/implementation-utils";
import { getImplementationPortalView } from "@/services/implementation-delivery.service";

interface CustomerPortalPageProps {
  params: Promise<{ token: string }>;
}

export default async function CustomerPortalPage({ params }: CustomerPortalPageProps) {
  const { token } = await params;

  try {
    const portal = await getImplementationPortalView(token);

    return (
      <CustomerPortalView
        project={serializeImplementationProject(portal.project)}
        milestones={portal.milestones}
        tasks={portal.tasks}
        issues={portal.issues}
      />
    );
  } catch {
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <h1 className="text-xl font-semibold">Implementation portal unavailable</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This portal link is invalid or has expired.
        </p>
      </div>
    );
  }
}
