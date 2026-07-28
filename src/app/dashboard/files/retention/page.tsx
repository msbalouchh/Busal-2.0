import { FilePlatformLists } from "@/modules/file-platform/components/file-platform-lists";
import { getFilePlatformRetentionContext } from "@/modules/file-platform/lib/get-file-platform-context";

export default async function FilePlatformRetentionPage() {
  const { policies } = await getFilePlatformRetentionContext();
  return <FilePlatformLists policies={policies} />;
}
