import { ProjectTemplatesList } from "@/modules/implementation/components/implementation-lists";
import { getProjectTemplatesContext } from "@/modules/implementation/lib/get-implementation-context";

export default async function ProjectTemplatesPage() {
  const { templates } = await getProjectTemplatesContext();

  return <ProjectTemplatesList templates={templates} />;
}
