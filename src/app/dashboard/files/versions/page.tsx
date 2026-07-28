import { FilePlatformLists } from "@/modules/file-platform/components/file-platform-lists";
import { getFilePlatformVersionsContext } from "@/modules/file-platform/lib/get-file-platform-context";

export default async function FilePlatformVersionsPage() {
  const { versions } = await getFilePlatformVersionsContext();
  return <FilePlatformLists versions={versions} />;
}
