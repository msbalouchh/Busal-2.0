import { FilePlatformLists } from "@/modules/file-platform/components/file-platform-lists";
import { getFilePlatformSharingContext } from "@/modules/file-platform/lib/get-file-platform-context";

export default async function FilePlatformSharingPage() {
  const { shareLinks } = await getFilePlatformSharingContext();
  return <FilePlatformLists shareLinks={shareLinks} />;
}
