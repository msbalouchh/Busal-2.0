import { FilePlatformLists } from "@/modules/file-platform/components/file-platform-lists";
import { getFilePlatformRegistryContext } from "@/modules/file-platform/lib/get-file-platform-context";

export default async function FilePlatformRegistryPage() {
  const { files } = await getFilePlatformRegistryContext();
  return <FilePlatformLists files={files} />;
}
